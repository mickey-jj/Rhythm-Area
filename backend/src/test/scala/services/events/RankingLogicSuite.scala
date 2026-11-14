package services.events
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*

class RankingLogicSuite extends munit.FunSuite:
  private val now=1800000000000L
  private val manual=RankingPolicy("manual","manual",None,None,None,None,None)
  private def initial(p: RankingPolicy)=RankingSession("e","q","waiting",None,None,None,None,1,p)
  private def row(id: String,value: String)=RankingRow(Entry(id,"e",id,id,"accepted",None,""),Some(value),true,Some(1),Nil)
  private val rules=Defaults.rules.copy(capacity=4,metric=Metric("分数","分",0,"0","101",true),stages=List(Stage("q","排名赛","ranking",2)))
  private val charts=(1 to 3).toList.map(i=>Chart("custom-rhythm","1",s"s$i",s"曲目$i","曲师",s"c$i","standard","EXPERT",None,"qualifier","qualifier",i))
  test("manual starts wait and publish starts open without shifting the recorded start on later requests") {
    assertEquals(RankingLogic.progress(initial(manual),manual,now,0,"registration").status,"waiting")
    val p=manual.copy(startMode="publish")
    val started=RankingLogic.progress(initial(p),p,now,0,"registration")
    assertEquals(started.status,"open")
    assertEquals(RankingLogic.progress(started,p,now+10000,0,"registration").startedAt,Some(now))
  }
  test("scheduled duration uses the scheduled instant even when the first request comes late") {
    val p=manual.copy(startMode="scheduled",endMode="duration",startAt=Some(java.time.Instant.ofEpochMilli(now).toString),durationSeconds=Some(60))
    assertEquals(RankingLogic.progress(initial(p),p,now-1,0,"registration").status,"waiting")
    val late=RankingLogic.progress(initial(p),p,now+30000,0,"registration")
    assertEquals(late.startedAt,Some(now));assertEquals(late.endsAt,Some(now+60000))
    assertEquals(RankingLogic.progress(late,p,now+60000,0,"registration").status,"closed")
  }
  test("fixed and duration deadlines reject the exact closing instant and retain their closing reason") {
    val policies=List(manual.copy(startMode="publish",endMode="fixed",deadline=Some(java.time.Instant.ofEpochMilli(now+10000).toString)),manual.copy(startMode="publish",endMode="duration",durationSeconds=Some(10)))
    policies.foreach { p =>
      val open=RankingLogic.progress(initial(p),p,now,0,"registration")
      assertEquals(RankingLogic.progress(open,p,now+9999,0,"registration").status,"open")
      val closed=RankingLogic.progress(open,p,now+10000,0,"registration")
      assertEquals(closed.status,"closed");assertEquals(closed.stopReason,Some[RankingStopReason]("deadline"));assertEquals(closed.closedAt,Some(now+10000))
      assertEquals(RankingLogic.progress(closed,p.copy(endMode="manual"),now+20000,0,"registration"),closed)
    }
  }
  test("threshold progress counts complete approved standings, supports lower-is-better, and stops on the target count") {
    val p=manual.copy(startMode="publish",endMode="threshold",targetCount=Some(2),targetScore=Some("290"))
    val rows=List(row("a","291"),row("b","290"),row("c","289"),row("d","300").copy(complete=false))
    assertEquals(RankingLogic.reached(rules,p,rows),2)
    assertEquals(RankingLogic.reached(rules.copy(metric=rules.metric.copy(higherWins=false)),p,rows),2)
    assertEquals(RankingLogic.progress(initial(p),p,now,2,"registration").stopReason,Some[RankingStopReason]("threshold"))
    assertEquals(RankingLogic.progress(initial(p),p,now,1,"registration").status,"open")
  }
  test("threshold validation uses whole-course totals and team aggregation without confusing members with entries") {
    val p=manual.copy(endMode="threshold",targetCount=Some(2),targetScore=Some("300"))
    assert(RankingLogic.validate(rules,rules.stages.head.copy(ranking=Some(p)),charts).isEmpty)
    assert(RankingLogic.validate(rules,rules.stages.head.copy(ranking=Some(p.copy(targetCount=Some(1)))),charts).nonEmpty)
    assert(RankingLogic.validate(rules,rules.stages.head.copy(ranking=Some(p.copy(targetScore=Some("304")))),charts).nonEmpty)
    val team=rules.copy(entryMode="team",team=rules.team.copy(perChart=2,aggregation="sum"))
    assert(RankingLogic.validate(team,team.stages.head.copy(ranking=Some(p.copy(targetScore=Some("600")))),charts).isEmpty)
  }
  test("materializing independent stage plans preserves behavior; stage disclosure and tie-break changes rebuild") {
    val old=Defaults.rules.copy(stages=List(Stage("s","阶段","single",1)))
    val p=StagePlan(old.metric,old.matchMode,old.winsRequired,old.draft,old.playOrder,old.resolution,Some("open"),Some(Nil))
    val independent=old.copy(stages=List(old.stages.head.copy(plan=Some(p))))
    assert(!RuleChanges.affectsSchedule(old,independent,Nil,Nil))
    val sealedRules=independent.copy(stages=List(old.stages.head.copy(plan=Some(p.copy(draftMode=Some("sealed"))))))
    val tieRules=independent.copy(stages=List(old.stages.head.copy(plan=Some(p.copy(tieBreak=Some(List("best-chart")))))))
    assert(RuleChanges.affectsSchedule(old,sealedRules,Nil,Nil))
    assert(RuleChanges.affectsSchedule(old,tieRules,Nil,Nil))
  }
