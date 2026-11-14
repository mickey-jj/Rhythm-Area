package services.events.api

import cats.effect.{IO, Resource}
import cats.syntax.all.*
import java.sql.Connection
import java.nio.file.{Files, Path}
import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import services.system.api.*
import services.system.utils.*
import services.events.utils.*

final case class PostMatchesByIdFinalizeMessage(idKey: MatchId, user: User, input: VersionInput) extends APIMessage[Map[String,String]]:
  def plan(connection: Connection): IO[Map[String,String]] =
    val expected = input.expectedVersion
    val result = {
      val id = idKey.value
      val repo = new RepositorySupport(connection)
      import repo.*
      val competition = new CompetitionSupport(connection)
      (for
          initial <- GetMatchesByIdMessage(id,Some(user.id)).plan(connection)
          e <- ReadEventMessage(initial.eventId,true).plan(connection)
          m <- GetMatchesByIdMessage(id,Some(user.id),true).plan(connection)
          _ <- RequireJudgeMessage(e,user.id,Some(id)).plan(connection)
          _ <- requireVersion(m.version,expected)
          _ <- check(m.status == "playing",409,"INVALID_STATE","本场尚不可结算或已经确认")
          pendingAppeals <- services.events.tables.appeals.AppealsTable.findServiceFinalizematch(connection, id)
          _ <- check(pendingAppeals==0,409,"PENDING_APPEAL","请先处理本场待定申诉")
          all <- ReadAttemptsMessage(e.id,Some(user.id),true).plan(connection).map(_.filter(_.matchId.contains(id)))
          _ <- check(!all.exists(_.status == "pending"),409,"PENDING_REVIEWS","本场仍有待审成绩")
          relevantSlots = if m.extraRound > 0 && m.rules.resolution.scope == "extra-only" then m.slots.filter(_.extraRound == m.extraRound) else m.slots
          ids = relevantSlots.map(_.id)
          latest = (entryId: String, round: Int) => all.filter(a => a.entryId==entryId && a.status=="approved" && a.items.headOption.exists(i=>m.slots.exists(s=>s.id==i.slotId && s.extraRound==round))).sortBy(-_.sequence).headOption
          value = (entryId: String, sid: String) => m.slots.find(_.id==sid).flatMap(s=>latest(entryId,s.extraRound)).flatMap(_.items.find(_.slotId==sid)).flatMap(i=>Engine.decimal(i.value))
          a <- m.a.liftTo[IO](AppError(409,ApiError("WAITING","对手未定")))
          b <- m.b.liftTo[IO](AppError(409,ApiError("WAITING","对手未定")))
          prefix = if m.rules.matchMode == "first-to" && m.extraRound == 0 then ids.takeWhile(s => value(a.id,s).nonEmpty && value(b.id,s).nonEmpty) else ids
          prefixScore = (entryId: String) => prefix.traverse(sid=>value(entryId,sid))
          sa <- prefixScore(a.id).filter(_.nonEmpty).liftTo[IO](AppError(409,ApiError("MISSING_SCORES","A 方缺已通过成绩")))
          sb <- prefixScore(b.id).filter(_.nonEmpty).liftTo[IO](AppError(409,ApiError("MISSING_SCORES","B 方缺已通过成绩")))
          effectiveRules = m.rules.copy(initialWinsA=if m.extraRound>0 then None else m.rules.initialWinsA,matchMode=if m.extraRound > 0 then "total" else m.rules.matchMode,playOrder = ids.map(i => PlaySlot(i,i)))
          result <- Engine.compare(effectiveRules,sa,sb,m.extraRound) match
            case Decision.Winner(side, av, bv) =>
              val winner = if side == "A" then a.id else b.id
              services.events.tables.results.ResultsTable.insertServiceFinalizematch(connection, id, m.version, winner, json(Map("a"->av,"b"->bv,"scope"->m.rules.resolution.scope)), user.id) *>
              competition.finishTx(e,id,winner) *>
              ReadAuditMessage(e.id,user.id,"match.finalize",s"$id · $side 方胜 · $av : $bv").plan(connection) *> s"${if side == "A" then a.displayName else b.displayName} 获胜，晋级已写入".pure[IO]
            case Decision.ExtraRound(scope) =>
              for
                charts <- ReadPoolMessage(e.id).plan(connection)
                used = m.slots.map(_.chartKey).toSet
                candidates = charts.filter(c => Engine.inPool(c,m.rules.resolution.extraPool) && Engine.roles(c).contains("extra") && !used(c.chart_key))
                _ <- check(candidates.size >= m.rules.resolution.extraCount,409,"EXTRA_POOL_EXHAUSTED","同分且加赛池耗尽，暂停待主办处理")
                randomSeed <- services.system.tables.system_health.SystemHealthTable.findServiceFinalizematch(connection)
                chosen = candidates.sortBy(c => services.system.objects.TokenDigest(randomSeed+c.chart_key)).take(m.rules.resolution.extraCount)
                _ <- chosen.zipWithIndex.traverse_((c,i) => services.events.tables.play_slots.PlaySlotsTable.insertServiceFinalizematch(connection, id, s"extra-${m.extraRound+1}-$i", c.chart_key, m.slots.size+i+1, m.extraRound+1))
                disclosed <- ReadRevealedChartsMessage(e.id).plan(connection)
                pendingReveal = chosen.exists(c=>Engine.roles(c).contains("mystery") && !disclosed(c.chart_key))
                _ <- services.events.tables.matches.MatchesTable.updateServiceFinalizematch(connection, if pendingReveal then "awaiting-reveal" else "playing", id)
                _ <- ReadAuditMessage(e.id,user.id,"match.extra",s"$id 同分，追加 ${chosen.size} 曲，$scope").plan(connection)
              yield "同分，已生成加赛曲目，请提交新一组成绩"
            case Decision.Pending(reason) => AppError(409,ApiError("UNRESOLVED",reason)).raiseError[IO,String]
        yield result)
    }
    result.map(message => Map("message" -> message))
