package services.events.utils
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.api.{ReadEventMessage,ReadAttemptsMessage}
import services.events.objects.apiTypes.*
import services.events.tables.match_clocks.MatchClocksTable
import services.system.tables.system_clock.SystemClockTable
private[events] final class MatchClockSupport(c: Connection):
  private val repo=new RepositorySupport(c)
  private[events] def resetReady(m: MatchView): IO[Unit] = for
    b <- board(m)
    _ <- if b.enabled then MatchClocksTable.save(c,b.clock.copy(phaseKey=MatchClockLogic.phase(m,0),chartIndex=0,status="ready",remainingMs=MatchClockLogic.duration(m,b.clock.policy),endsAt=None,version=b.clock.version+1)).void else IO.unit
  yield ()
  private[events] def board(m: MatchView,manage: Boolean=false): IO[MatchClockBoard] = for
    now <- SystemClockTable.milliseconds(c)
    stored <- MatchClocksTable.find(c,m.id)
    e <- ReadEventMessage(m.eventId).plan(c)
    policy=if m.scheduleState==ScheduleState.Current then e.rules.stages.find(_.id==m.stageId).flatMap(_.effective(e.rules).timing).orElse(m.rules.timing) else m.rules.timing
    current=MatchClockLogic.progress(m.copy(rules=m.rules.copy(timing=policy)),stored,now)
    scores <- if m.status=="playing" then services.events.tables.attempts.AttemptsTable.approvedMatchSlots(c,m.id,m.generation) else IO.pure(Nil)
    complete=m.status=="playing" && m.slots.nonEmpty && List(m.a,m.b).flatten.size==2 && List(m.a,m.b).flatten.forall(en=>m.slots.filter(_.extraRound==m.extraRound).forall(s=>scores.contains((en.id,s.id))))
    next=if complete && current.status!="finished" then current.copy(status="finished",endsAt=None,remainingMs=0,version=current.version+1) else current
    enabled=stored.nonEmpty || policy.nonEmpty
    _ <- if enabled && !stored.contains(next) then MatchClocksTable.save(c,next).void else IO.unit
  yield MatchClockBoard(next,now,enabled,manage)
  private[events] def requireActive(m: MatchView): IO[MatchClockBoard] = for
    b <- board(m)
    _ <- repo.check(!b.enabled || b.clock.status=="running",409,"CLOCK_STOPPED","请先开赛；暂停或超时后由裁判恢复计时")
  yield b
