package services.events
import munit.FunSuite
import services.events.objects.*
import services.events.objects.apiTypes.MatchView
import services.events.utils.{MatchClockLogic,Engine,RuleChanges}
class MatchClockSuite extends FunSuite:
  private def room(status: MatchStatus="drafting") = MatchView("m","e",1,0,None,None,None,status,1,0,Defaults.rules.copy(timing=Some(MatchTiming())),Nil,Nil,Nil,None,"s","阶段","winners",1)
  test("new timed matches wait for an explicit start and polling never resets their deadline") {
    val m=room()
    val ready=MatchClockLogic.progress(m,None,1000)
    assertEquals(ready.status,"ready")
    assertEquals(ready.remainingMs,60000L)
    val active=ready.copy(status="running",endsAt=Some(61000))
    assertEquals(MatchClockLogic.progress(m,Some(active),5000),active)
  }
  test("expiry is exact and paused clocks do not elapse") {
    val m=room()
    val s=MatchClockLogic.progress(m,None,0).copy(status="running",endsAt=Some(60000))
    assertEquals(MatchClockLogic.progress(m,Some(s),59999).status,"running")
    assertEquals(MatchClockLogic.progress(m,Some(s),60000).status,"expired")
    val paused=s.copy(status="paused",remainingMs=12345,endsAt=None)
    assertEquals(MatchClockLogic.progress(m,Some(paused),999999),paused)
  }
  test("each BP action gets a fresh allowance while play waits for the judge") {
    val m=room()
    val old=MatchClockLogic.progress(m,None,0).copy(phaseKey="bp:1:-1",status="running",endsAt=Some(60000))
    val next=MatchClockLogic.progress(m,Some(old),10000)
    assertEquals(next.endsAt,Some(70000L))
    val play=MatchClockLogic.progress(room("playing"),Some(next),11000)
    assertEquals(play.status,"ready")
    assertEquals(play.remainingMs,240000L)
  }
  test("replays reset their index and historical or final matches cannot keep running") {
    val m=room("playing")
    val s=MatchClockLogic.progress(m,None,0).copy(chartIndex=2,phaseKey="play:0:0:2",status="running",endsAt=Some(10000))
    assertEquals(MatchClockLogic.progress(m,Some(s),1000).chartIndex,0)
    assertEquals(MatchClockLogic.progress(m.copy(scheduleState=ScheduleState.Historical),Some(s),1000).status,"finished")
    assertEquals(MatchClockLogic.progress(room("finalized"),Some(s),1000).status,"finished")
  }
  test("invalid times are rejected and changing the clock does not rebuild a bracket") {
    val r=Defaults.rules.copy(timing=Some(MatchTiming()))
    assert(Engine.validate(r.copy(timing=Some(MatchTiming(0,240))),Nil).issues.exists(_.fieldPath=="timing.draftSeconds"))
    assert(!RuleChanges.affectsSchedule(r,r.copy(timing=Some(MatchTiming(90,300))),Nil,Nil))
  }
