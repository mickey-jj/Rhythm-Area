package services.events.utils

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

private[events] final class TeamsSupport(connection: Connection):
  private val repo = new RepositorySupport(connection)
  import repo.*
  private[events] def viewsTx(eid: String, viewer: Option[String]): IO[List[TeamView]] =
    services.events.tables.teams.TeamsTable.findTeamsViewstx(connection, eid).flatMap(_.traverse { (id,n,c,code,en,frozen) =>
      services.events.tables.team_members.TeamMembersTable.findTeamsViewstx(connection, id).map(ms => TeamView(id,n,c,Option.when(viewer.exists(v => ms.exists(_.id==v)))(code),en,frozen,ms))
    })
  private[events] def aggregateTx(e: EventView,en: Entry,in: AttemptInput): IO[List[ScoreItem]] =
    if e.rules.entryMode!="team" then in.items.pure[IO]
    else for
      scores <- if in.groupId.nonEmpty then
        for
          group <- new EliminationSupport(connection).read(in.groupId.get)
          members <- services.events.tables.team_members.TeamMembersTable.findTeamsAggregatetx(connection,en.id)
          clock <- new GroupClockSupport(connection).board(group)
          slots=group.charts.take(if clock.enabled then clock.clock.chartIndex+1 else group.charts.size).map(_.chart_key)
          raw=in.memberScores.getOrElse(Nil)
          _ <- validateMembers(group.rules,slots,members,raw)
        yield aggregate(group.rules,slots,raw)
      else in.matchId match
        case None =>
          for
            members <- services.events.tables.team_members.TeamMembersTable.findTeamsAggregatetx(connection, en.id)
            slots <- ReadPoolMessage(e.id).plan(connection).map(_.filter(c=>Engine.inPool(c,"qualifier")).map(_.chart_key))
            raw = in.memberScores.getOrElse(Nil)
            _ <- validateMembers(e.rules,slots,members,raw)
          yield aggregate(e.rules,slots,raw)
        case Some(mid) =>
          for
            m <- GetMatchesByIdMessage(mid,Some(en.userId)).plan(connection)
            fullLineup <- services.events.tables.lineups.LineupsTable.findTeamsAggregatetx(connection, mid, en.id)
            clock <- new MatchClockSupport(connection).board(m)
            slots = m.slots.filter(_.extraRound==m.extraRound).take(if clock.enabled then clock.clock.chartIndex+1 else m.slots.size).map(_.id)
            lineup=fullLineup.filter(l=>slots.contains(l._1))
            raw = in.memberScores.getOrElse(Nil)
            _ <- check(raw.nonEmpty && raw.map(s => (s.slotId,s.userId)).distinct.size==raw.size && raw.map(s => (s.slotId,s.userId)).toSet==lineup.toSet,400,"INVALID_MEMBER_SCORES","逐人逐曲成绩必须与已冻结阵容完全一致")
            _ <- validateMembers(m.rules,slots,lineup.map(_._2).distinct,raw)
          yield aggregate(m.rules,slots,raw)
    yield scores
  private[events] def validateMembers(r: RuleSet,slots: List[String],members: List[String],raw: List[MemberScore]): IO[Unit] = for
    _ <- check(raw.map(s=>(s.slotId,s.userId)).distinct.size==raw.size && raw.map(_.slotId).toSet==slots.toSet && raw.forall(s=>members.contains(s.userId)),400,"INVALID_MEMBER_SCORES","成员、曲目或重复数据与冻结名单不符")
    _ <- check(slots.forall(id=>raw.count(_.slotId==id)==r.team.perChart),400,"INVALID_MEMBER_SCORES","每曲必须使用完全相同数量的上场成员")
    _ <- check(raw.groupMapReduce(_.userId)(_=>1)(_+_).values.forall(_<=r.team.maxAppearances),400,"APPEARANCE_LIMIT","超过单组最多出场次数")
    _ <- raw.traverse_(s => Engine.validateScore(s.value,r.metric).leftMap(i => AppError(400,ApiError("INVALID_SCORE",i.message))).liftTo[IO].void)
  yield ()
  private[events] def aggregate(r: RuleSet,slots: List[String],raw: List[MemberScore]): List[ScoreItem] = slots.map { sid =>
    val values=raw.filter(_.slotId==sid).flatMap(s=>Engine.decimal(s.value))
    val sum=values.sum
    val value=if r.team.aggregation=="average" then (sum/BigDecimal(values.size)).setScale(r.metric.decimals,BigDecimal.RoundingMode.HALF_UP) else sum
    ScoreItem(sid,value.bigDecimal.stripTrailingZeros.toPlainString)
  }
