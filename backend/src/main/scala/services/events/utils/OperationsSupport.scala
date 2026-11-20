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

private[events] final class OperationsSupport(connection: Connection):
  private val repo = new RepositorySupport(connection)
  import repo.*
  private[events] def judgesTx(eid: String): IO[List[Map[String,String]]] =
    services.identity.tables.users.UsersTable.findOperationsJudgestx(connection, eid, eid).map(_.map((u,n,m)=>Map("username"->u,"name"->n,"matchId"->m)))
  private[events] def replayTx(user: User,e: EventView,mid: String,in: MatchDecision): IO[Unit] = for
    m <- GetMatchesByIdMessage(mid,Some(user.id),true).plan(connection)
    _ <- RequireJudgeMessage(e,user.id,Some(mid)).plan(connection)
    _ <- check(m.scheduleState==ScheduleState.Current,409,"HISTORICAL_MATCH","原赛程场次已保留为历史记录，请操作新赛程")
    _ <- check(m.a.nonEmpty && m.b.nonEmpty,409,"WAITING","两方尚未确定，不可重赛或改判")
    _ <- requireVersion(m.version,in.expectedVersion)
    participants <- List(m.a,m.b).flatten.traverse(en => services.events.tables.team_members.TeamMembersTable.findTeamsLineup(connection,en.id).map(_ :+ en.userId)).map(_.flatten)
    _ <- check(in.winnerId.isEmpty || !participants.contains(user.id),403,"SELF_DECISION","禁止对本人或本队参赛的比赛进行胜负改判，请由独立裁判处理")
    _ <- check(in.reason.trim.nonEmpty && in.reason.length<=2000 && e.status!="archived",400,"REASON_REQUIRED","请填写故障、重赛或改判的详细依据；归档后不可修改")
    key <- services.events.tables.matches.MatchesTable.findOperationsReplaytx(connection, mid)
    reset=new MatchResetSupport(connection)
    mids <- reset.followers(e,m.stageId,Set(key))
    _ <- services.events.tables.match_history.MatchHistoryTable.insertOperationsReplaytx(connection, mid, m.generation, mid, mid, mid, in.reason, user.id, mid)
    _ <- reset.clearFollowers(mids,user.id,in.reason)
    _ <- services.events.tables.attempts.AttemptsTable.updateOperationsReplaytx(connection, mid)
    _ <- services.events.tables.draft_actions.DraftActionsTable.deleteOperationsReplaytx(connection, mid)
    _ <- services.events.tables.play_slots.PlaySlotsTable.deleteOperationsReplaytx(connection, mid)
    _ <- services.events.tables.lineups.LineupsTable.deleteOperationsReplaytx(connection, mid)
    _ <- services.events.tables.matches.MatchesTable.updateOperationsReplaytx2(connection, mid)
    _ <- if m.rules.draft.isEmpty && in.winnerId.isEmpty then Engine.buildPlayOrder(m.rules,DraftState(Nil)).zipWithIndex.traverse_((pair,i)=>services.events.tables.play_slots.PlaySlotsTable.insertCompetitionSynchronizetx(connection,mid,pair._1.id,pair._2,i+1)) *> services.events.tables.matches.MatchesTable.prepareFixedMatch(connection,mid).void else IO.unit
    _ <- services.events.tables.competition_stages.CompetitionStagesTable.updateOperationsReplaytx(connection, e.id, m.stageId)
    _ <- services.events.tables.events.EventsTable.updateOperationsReplaytx(connection, e.id)
    _ <- in.winnerId.traverse_(w => check(m.a.exists(_.id==w)||m.b.exists(_.id==w),400,"INVALID_WINNER","改判胜方必须是本场参赛方") *> services.events.tables.results.ResultsTable.insertOperationsReplaytx(connection, mid, m.version+1, w, json(Map("correction"->in.reason)), user.id) *> ReadEventMessage(e.id).plan(connection).flatMap(current=>new CompetitionSupport(connection).finishTx(current,mid,w)))
    _ <- if in.winnerId.isEmpty then GetMatchesByIdMessage(mid,Some(user.id)).plan(connection).flatMap(new MatchClockSupport(connection).resetReady) else IO.unit
    _ <- ReadAuditMessage(e.id,user.id,if in.winnerId.isDefined then "match.correct" else "match.replay",mid+" · "+in.reason).plan(connection)
  yield ()
  private[events] def appealsTx(e: EventView,viewer: String): IO[List[AppealView]] =
    services.events.tables.appeals.AppealsTable.findOperationsAppealstx(connection, e.id).flatMap(_.filterA(a=>IsJudgeMessage(e,viewer,Some(a.matchId)).plan(connection).map(_ || a.userId==viewer)))
