package services.events.utils
import services.events.objects.*
import services.events.objects.apiTypes.MatchView
private[events] object MatchClockLogic:
  private[events] def phase(m: MatchView,index: Int): String =
    if m.status=="drafting" then s"bp:${m.generation}:${m.actions.size}" else if m.status=="awaiting-reveal" then s"reveal:${m.generation}:${m.extraRound}" else s"play:${m.generation}:${m.extraRound}:$index"
  private[events] def duration(m: MatchView,p: MatchTiming): Long = (if m.status=="drafting" then p.draftSeconds else p.chartSeconds).toLong*1000
  private[events] def progress(m: MatchView,current: Option[MatchClock],now: Long): MatchClock =
    val p=m.rules.timing.orElse(current.map(_.policy)).getOrElse(MatchTiming())
    val index=if current.exists(c=>c.phaseKey.startsWith(s"play:${m.generation}:${m.extraRound}:")) then current.get.chartIndex else 0
    val key=phase(m,index)
    val initial=current.getOrElse(MatchClock(m.id,key,index,"ready",duration(m,p),None,1,p))
    val finished=m.status=="finalized" || m.status=="bye" || m.status=="cancelled" || m.scheduleState==ScheduleState.Historical
    val next=if finished then initial.copy(status="finished",endsAt=None) else if key!=initial.phaseKey then
      val automatic=initial.status=="running" && m.status=="drafting"
      initial.copy(phaseKey=key,chartIndex=index,status=if automatic then "running" else "ready",remainingMs=duration(m,p),endsAt=Option.when(automatic)(now+duration(m,p)),policy=p)
    else if initial.status=="ready" && initial.policy!=p then initial.copy(policy=p,remainingMs=duration(m,p))
    else if initial.status=="running" && initial.endsAt.exists(_<=now) then initial.copy(status="expired",remainingMs=0,endsAt=None) else initial
    if next!=initial then next.copy(version=initial.version+1) else next
