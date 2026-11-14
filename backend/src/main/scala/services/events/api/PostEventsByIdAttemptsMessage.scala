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

final case class PostEventsByIdAttemptsMessage(idKey: EventId, user: User, input: AttemptInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val eventKey = idKey
    val raw = input
    val result = {
      val eventId = eventKey.value
      val service = new ServiceSupport(connection)
      import service.*
      val repo = new RepositorySupport(connection)
      import repo.*
      val teams = new TeamsSupport(connection)
      NewIdMessage().plan(connection).flatMap { attemptId => (for
          e <- ReadEventMessage(eventId,true).plan(connection)
          group <- raw.groupId.traverse(id=>new EliminationSupport(connection).read(id))
          _ <- check(raw.groupId.isEmpty || raw.matchId.isEmpty,400,"INVALID_CONTEXT","不能同时提交对局与多人晋级轮成绩")
          en <- ReadEntryMessage(raw.entryId).plan(connection)
          aggregated <- teams.aggregateTx(e,en,raw)
          in = raw.copy(items=aggregated)
          _ <- check(en.eventId == eventId && en.userId == user.id && en.status == "accepted",403,"NOT_ELIGIBLE","仅已通过的选手可提交本人成绩")
          _ <- check(Set("registration","running").contains(e.status),409,"CLOSED","当前已停止交分")
          slots <- in.matchId match
            case Some(mid) => GetMatchesByIdMessage(mid,Some(user.id),true).plan(connection).flatMap(m =>
              check(m.eventId == eventId && m.status == "playing" && (m.a.exists(_.id == en.id) || m.b.exists(_.id == en.id)),409,"INVALID_MATCH","不属于本场或尚不可交分") *>
                m.slots.filter(_.extraRound == m.extraRound).map(_.id).pure[IO])
            case None if group.nonEmpty =>
              val g=group.get
              check(g.eventId==eventId && g.scheduleState==ScheduleState.Current && g.status=="playing" && e.status=="running" && g.participants.contains(en.id),409,"GROUP_CLOSED","不属于本轮、尚未开始或已停止交分") *> g.charts.map(_.chart_key).pure[IO]
            case None => withinWindow(e,"qualifier") *> check(e.status == "registration" && e.rules.stages.exists(_.kind == "ranking"),409,"QUALIFIER_CLOSED","未启用海选或海选已结束") *> ReadPoolMessage(eventId).plan(connection).map(_.filter(c => Engine.inPool(c,"qualifier")).map(_.chart_key))
          scoringRules <- in.matchId.traverse(mid => GetMatchesByIdMessage(mid,Some(user.id)).plan(connection).map(_.rules)).map(_.orElse(group.map(_.rules)).getOrElse(e.rules))
          matchClock <- in.matchId.traverse(mid=>GetMatchesByIdMessage(mid,Some(user.id),true).plan(connection).flatMap(m=>new MatchClockSupport(connection).requireActive(m)))
          groupClock <- group.traverse(g=>new GroupClockSupport(connection).requireActive(g))
          clock=matchClock.orElse(groupClock)
          timed=clock.exists(_.enabled)
          isPrefix = (scoringRules.matchMode == "first-to" || timed) && (in.matchId.nonEmpty || group.nonEmpty)
          _ <- check(!timed || in.items.size==clock.get.clock.chartIndex+1,409,"WRONG_CHART","请提交当前曲目及此前已交成绩")
          _ <- check(slots.nonEmpty && in.items.nonEmpty && (if isPrefix then slots.take(in.items.size) == in.items.map(_.slotId) else in.items.map(_.slotId) == slots),400,"INVALID_ATTEMPT","须按规定曲序一次提交全部项目，不得跨局拼分")
          prior <- if timed then ReadAttemptsMessage(eventId,Some(user.id),false).plan(connection).map(_.filter(a=>a.matchId==in.matchId && a.groupId==in.groupId && a.entryId==en.id && a.status=="approved").sortBy(-_.sequence).headOption) else IO.pure(None)
          _ <- check(!timed || in.items.dropRight(1).forall(i=>prior.exists(_.items.exists(p=>p.slotId==i.slotId && p.value==i.value))),409,"PAST_SCORE_LOCKED","此前已审核曲目不能在后续交分中修改")
          _ <- check(!timed || in.memberScores.getOrElse(Nil).filter(s=>in.items.dropRight(1).exists(_.slotId==s.slotId)).forall(s=>prior.exists(_.memberScores.contains(s))),409,"PAST_MEMBER_SCORE_LOCKED","此前已审核的成员和成绩不能修改")
          aggregateMetric = if scoringRules.entryMode=="team" && scoringRules.team.aggregation=="sum" then scoringRules.metric.copy(minimum=(Engine.decimal(scoringRules.metric.minimum).get*scoringRules.team.perChart).toString,maximum=(Engine.decimal(scoringRules.metric.maximum).get*scoringRules.team.perChart).toString) else scoringRules.metric
          _ <- in.items.traverse_(i => Engine.validateScore(i.value,aggregateMetric).leftMap(er => AppError(400,ApiError("INVALID_SCORE",er.message))).liftTo[IO].void)
          _ <- check(in.evidenceNote.trim.nonEmpty && in.evidenceNote.length <= 2000,400,"EVIDENCE_REQUIRED","请填写现场见证说明或证据链接（演示不自动证明真实性）")
          generation <- in.matchId.traverse(mid => services.events.tables.matches.MatchesTable.findServiceSubmit(connection, mid)).map(_.getOrElse(0))
          _ <- in.evidenceId.traverse_(fid => services.events.tables.evidence_files.EvidenceFilesTable.findServiceSubmit(connection, fid, eventId, user.id).flatMap(n=>check(n==1,403,"INVALID_EVIDENCE","只能关联自己上传到当前赛事的证据")))
          _ <- services.events.tables.attempts.AttemptsTable.insertServiceSubmit(connection, attemptId, eventId, in.matchId, in.entryId, user.id, in.evidenceNote, generation, in.evidenceId)
          _ <- group.traverse_(g=>services.events.tables.attempts.AttemptsTable.setGroup(connection,g.id,attemptId) *> services.events.tables.elimination_groups.EliminationGroupsTable.save(connection,g.copy(version=g.version+1)))
          _ <- in.memberScores.getOrElse(Nil).traverse_(s => services.events.tables.attempt_member_scores.AttemptMemberScoresTable.insertServiceSubmit(connection, attemptId, s.slotId, s.userId, Engine.decimal(s.value).get))
          _ <- in.items.zipWithIndex.traverse_((i,n) => services.events.tables.attempt_items.AttemptItemsTable.insertServiceSubmit(connection, attemptId, i.slotId, Engine.decimal(i.value).get, n))
          _ <- ReadAuditMessage(eventId,user.id,"attempt.submit",s"${en.displayName} 提交完整尝试，等待审核").plan(connection)
        yield ()) }
    }
    result.as(Map("ok" -> true))
