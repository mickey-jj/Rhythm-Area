package services.events.utils
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.api.ReadEventMessage
import services.events.tables.group_clocks.GroupClocksTable
import services.system.tables.system_clock.SystemClockTable
private[events] object GroupClockSupport:
  private[events] def view(g: EliminationGroup): MatchView = MatchView(g.id,g.eventId,g.round,0,None,None,None,if g.status=="completed" then "finalized" else if g.status=="playing" then "playing" else "waiting",g.version,0,g.rules,Nil,g.charts.zipWithIndex.map((c,i)=>MatchSlot(c.chart_key,c.chart_key,i+1,0)),Nil,None,g.stageId,g.stageName,"losers",0,g.scheduleState,"double")
private[events] final class GroupClockSupport(c: Connection):
  private val repo=new RepositorySupport(c)
  private[events] def resetReady(g: EliminationGroup): IO[Unit] = for
    b <- board(g)
    m=GroupClockSupport.view(g)
    _ <- if b.enabled then GroupClocksTable.save(c,b.clock.copy(phaseKey=MatchClockLogic.phase(m,0),chartIndex=0,status="ready",remainingMs=MatchClockLogic.duration(m,b.clock.policy),endsAt=None,version=b.clock.version+1)).void else IO.unit
  yield ()
  private[events] def board(g: EliminationGroup,manage: Boolean=false): IO[MatchClockBoard] = for
    now <- SystemClockTable.milliseconds(c)
    e <- ReadEventMessage(g.eventId).plan(c)
    policy=e.rules.stages.find(_.id==g.stageId).flatMap(_.effective(e.rules).timing).orElse(g.rules.timing)
    stored <- GroupClocksTable.find(c,g.id)
    current=MatchClockLogic.progress(GroupClockSupport.view(g.copy(rules=g.rules.copy(timing=policy))),stored,now)
    attempts <- new EliminationSupport(c).attempts(g.id)
    complete=g.participants.nonEmpty && g.participants.forall(en=>g.charts.forall(s=>attempts.exists(a=>a.entryId==en&&a.status=="approved"&&a.items.exists(_.slotId==s.chart_key))))
    next=if complete && current.status!="finished" then current.copy(status="finished",endsAt=None,remainingMs=0,version=current.version+1) else current
    enabled=stored.nonEmpty || policy.nonEmpty
    _ <- if enabled && !stored.contains(next) then GroupClocksTable.save(c,next).void else IO.unit
  yield MatchClockBoard(next,now,enabled,manage)
  private[events] def requireActive(g: EliminationGroup): IO[MatchClockBoard] = for
    b <- board(g)
    _ <- repo.check(!b.enabled || b.clock.status=="running",409,"CLOCK_STOPPED","本轮尚未开赛、已暂停或超时")
  yield b
