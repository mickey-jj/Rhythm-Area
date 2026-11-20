package services.events.utils
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.tables.ranking_sessions.RankingSessionsTable
import services.events.tables.qualifier_snapshots.QualifierSnapshotsTable
import services.system.tables.system_clock.SystemClockTable
import services.system.api.*

private[events] final class RankingSupport(connection: Connection):
  private val repo=new RepositorySupport(connection)
  import repo.*
  private[events] def synchronize(e: EventView): IO[Option[RankingBoard]] = e.rules.stages.headOption.filter(_.kind=="ranking").traverse { stage => for
    now <- SystemClockTable.milliseconds(connection)
    snapshot <- QualifierSnapshotsTable.findTransport(connection,e.id)
    rows <- snapshot.map(s=>IO.pure(readJson[List[RankingRow]](s))).getOrElse(new ServiceSupport(connection).rankingsTx(e))
    stored <- RankingSessionsTable.find(connection,e.id,stage.id)
    policy=RankingLogic.policy(e.rules,stage)
    initial=stored.getOrElse(RankingSession(e.id,stage.id,"waiting",None,None,None,None,1,policy))
    count=RankingLogic.reached(e.rules,if initial.status=="closed" then initial.policy else policy,rows)
    next=if e.status=="draft" then initial.copy(status="waiting",startedAt=None,endsAt=None,closedAt=None,stopReason=None,policy=policy) else RankingLogic.progress(initial,policy,now,count,e.status)
    updated=if stored.nonEmpty && next!=initial then next.copy(version=initial.version+1) else next
    _ <- if e.status!="draft" && !stored.contains(updated) then RankingSessionsTable.save(connection,updated).void else IO.unit
  yield RankingBoard(stage.id,stage.name,updated,now,count,rows,false) }
  private[events] def requireOpen(e: EventView): IO[Unit] = for
    board <- synchronize(e)
    _ <- check(board.exists(_.session.status=="open") && e.status=="registration",409,"RANKING_CLOSED","排名赛尚未开始或已停止收分")
  yield ()
  private[events] def close(e: EventView, reason: RankingStopReason): IO[Unit] = for
    board <- synchronize(e)
    _ <- board.filter(_.session.status!="closed").traverse_(b=>RankingSessionsTable.save(connection,b.session.copy(status="closed",closedAt=Some(b.serverNow),stopReason=Some(reason),version=b.session.version+1)).void)
  yield ()
