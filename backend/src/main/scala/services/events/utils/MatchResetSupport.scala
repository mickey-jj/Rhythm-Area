package services.events.utils
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.api.*
import services.events.tables.matches.MatchesTable
import services.events.tables.match_history.MatchHistoryTable
import services.events.tables.draft_actions.DraftActionsTable
import services.events.tables.play_slots.PlaySlotsTable
import services.events.tables.lineups.LineupsTable
import services.events.tables.elimination_groups.EliminationGroupsTable
import services.events.tables.competition_stages.CompetitionStagesTable

private[events] final class MatchResetSupport(connection: Connection):
  private val repo=new RepositorySupport(connection)
  private[events] def followers(e: EventView, stageId: String, roots: Set[String]): IO[List[String]] = for
    stages <- CompetitionStagesTable.findOperationsReplaytx(connection,e.id)
    later=e.rules.stages.dropWhile(_.id!=stageId).drop(1).map(_.id)
    _ <- repo.check(!stages.exists((id,_)=>later.contains(id)),409,"DOWNSTREAM_FROZEN","后续阶段已生成，请先处理后续阶段，保留当前晋级来源")
    state <- new CompetitionSupport(connection).stateTx(e.id,stageId)
    initial=if roots("F1") then roots+"F2" else roots
    affected=state._1.foldLeft(initial)((acc,_)=>acc ++ state._1.filter(f=>List(f.a,f.b).exists(ref=>acc.exists(k=>ref=="winner:"+k || ref=="loser:"+k))).map(_.key))
    groups <- EliminationGroupsTable.list(connection,e.id)
    _ <- repo.check(!groups.exists(g=>g.stageId==stageId && g.scheduleState==ScheduleState.Current && g.status!="waiting" && g.sources.exists(ref=>affected.exists(k=>ref=="winner:"+k || ref=="loser:"+k))),409,"DOWNSTREAM_STARTED","后续同曲晋级轮已开始，请先重置后续场次")
    rows <- MatchesTable.findOperationsReplaytx2(connection,e.id,stageId)
    ids=rows.filter((_,key)=>affected(key) && !roots(key)).map(_._1)
    _ <- ids.traverse_(id=>MatchesTable.hasActiveProgress(connection,id).flatMap(started=>repo.check(!started,409,"DOWNSTREAM_STARTED","后续比赛已开赛、选禁或交分，请先重置后续场次")))
  yield ids

  private[events] def clearFollowers(ids: List[String], userId: String, reason: String): IO[Unit] = ids.traverse_ { id => for
    m <- GetMatchesByIdMessage(id,Some(userId),true).plan(connection)
    _ <- MatchHistoryTable.insertOperationsReplaytx(connection,id,m.generation,id,id,id,reason,userId,id)
    _ <- DraftActionsTable.deleteOperationsReplaytx(connection,id)
    _ <- PlaySlotsTable.deleteOperationsReplaytx(connection,id)
    _ <- LineupsTable.deleteOperationsReplaytx(connection,id)
    _ <- if m.bracket=="reset" then MatchesTable.retireResetFinal(connection,id) else MatchesTable.updateOperationsReplaytx(connection,id)
  yield () }
