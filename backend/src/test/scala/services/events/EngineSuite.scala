package services.events
import services.events.objects.*
import services.events.objects.given
import services.events.utils.*

class EngineSuite extends munit.FunSuite:
  private val r = Defaults.rules
  private def chart(i: Int, pool: String = "main"): Chart = Chart("custom-rhythm","1.0",s"song-$i",s"Song $i","Demo",s"chart-$i","standard","EXPERT",Some(BigDecimal(13)),pool,"",i)
  private val charts = (1 to 10).toList.map(i => chart(i)) ++ List(chart(11,"extra"),chart(12,"extra"),chart(13,"extra"),chart(14,"qualifier"))
  test("official COP, WEC qualification and KOP stage plans validate with researched pools") {
    List("cop-2025", "wec-2026", "kop-7th").foreach { id =>
      val text = java.nio.file.Files.readString(services.system.utils.SystemConfig.root.resolve(s"examples/$id/template.json"))
      val preset = io.circe.parser.decode[services.instance.objects.apiTypes.EventTemplate](text).fold(error => fail(s"$id: $error"), identity)
      val validation = Engine.validate(preset.rules, preset.charts)
      assert(validation.valid, s"$id: ${validation.issues}")
    }
    assert(!Engine.validate(r.copy(stages=List(Stage("final","淘汰赛","single",2))), charts).valid)
  }
  test("overlapping pools share chart identity and cannot evade prior picks or bans") {
    val shared = charts.map(c=>c.copy(pool_tag=c.pool_tag+"|stage2"))
    val plan = r.copy(draft=List(DraftStep("a","A","pick",1,"main",true,"pool"),DraftStep("b","B","pick",1,"stage2",true,"pool")),playOrder=List(PlaySlot("a","a:1"),PlaySlot("b","b:1")))
    assert(Engine.validate(plan,shared).valid)
    val state=Engine.applyDraftAction(plan,shared,DraftState(Nil),"A","chart-1").toOption.get
    assert(!Engine.eligibleCharts(plan,shared,state).exists(_.chart_key=="chart-1"))
    assert(Engine.inPool(shared.head,"stage2"))
    assert(!Engine.validate(plan,shared :+ shared.head).valid)
    val removing=plan.copy(draft=plan.draft.take(1) :+ DraftStep("remove","B","remove",1,"stage2",false,"picked") :+ DraftStep("assign","referee","random",1,"main",false,"pool"),playOrder=List(PlaySlot("a","a:1"),PlaySlot("r","assign:1")))
    assert(Engine.validate(removing,shared).valid)
    assert(Engine.eligibleCharts(removing,shared,state).exists(_.chart_key=="chart-1"))
  }
  test("referee assignment produces an ordered slot and supports hidden original charts") {
    val c=chart(99,"secret").copy(role="assign|mystery")
    val plan=r.copy(draft=List(DraftStep("reveal-final","referee","assign",1,"secret",false,"pool")),playOrder=List(PlaySlot("final","reveal-final:1")))
    assert(Engine.validate(plan,charts :+ c).valid)
    val state=Engine.applyDraftAction(plan,charts :+ c,DraftState(Nil),"referee",c.chart_key).toOption.get
    assertEquals(Engine.buildPlayOrder(plan,state).map(_._2),List(c.chart_key))
    assert(!Engine.validate(plan.copy(draft=plan.draft.map(_.copy(actor="A"))),charts :+ c).valid)
    assert(!Engine.validate(plan,charts :+ c.copy(role="assign|pick|mystery")).valid)
  }
  test("valid generic template passes; empty pool is rejected") {
    assert(Engine.validate(r,charts).valid)
    assert(!Engine.validate(r,Nil).valid)
  }
  test("target wins are only required by first-to mode, not hidden total-score settings") {
    assert(Engine.validate(r.copy(matchMode="total",winsRequired=0),charts).valid)
    assert(!Engine.validate(r.copy(matchMode="first-to",winsRequired=0),charts).valid)
  }
  test("cross-game and duplicate IDs are rejected, names do not merge charts") {
    assert(!Engine.validate(r,charts :+ charts.head).valid)
    assert(!Engine.validate(r,charts.updated(0,charts.head.copy(game_key="other"))).valid)
    assert(Engine.validate(r,charts.updated(1,charts(1).copy(title=charts.head.title))).valid)
  }
  test("exact decimal boundaries; values above 100 are allowed when configured") {
    val m = Metric("达成率","%",4,"0","101",true)
    assertEquals(Engine.validateScore("100.9999",m),Right(BigDecimal("100.9999")))
    assert(Engine.validateScore("101.0001",m).isLeft)
    assert(Engine.validateScore("99.00001",m).isLeft)
    assert(Engine.validateScore("NaN",m).isLeft)
    assert(Engine.validateScore("1e2",m).isLeft)
  }
  test("draft rejects wrong actor, bans and repeated picks") {
    val s1=Engine.applyDraftAction(r,charts,DraftState(Nil),"A","chart-1").toOption.get
    assert(Engine.applyDraftAction(r,charts,s1,"A","chart-2").isLeft)
    val s2=Engine.applyDraftAction(r,charts,s1,"B","chart-2").toOption.get
    assert(Engine.applyDraftAction(r,charts,s2,"A","chart-1").isLeft)
    val s3=Engine.applyDraftAction(r,charts,s2,"A","chart-3").toOption.get
    assert(Engine.applyDraftAction(r,charts,s3,"B","chart-3").isLeft)
  }
  test("referee random may select a banned chart but never an already picked chart") {
    val actions=List[(Actor,String)](("A","chart-1"),("B","chart-2"),("A","chart-3"),("B","chart-4"))
    val state=actions.foldLeft(DraftState(Nil))((s,a)=>Engine.applyDraftAction(r,charts,s,a._1,a._2).toOption.get)
    val candidates=Engine.eligibleCharts(r,charts,state).map(_.chart_key)
    assert(candidates.contains("chart-1"));assert(!candidates.contains("chart-3"))
  }
  test("play order is independent from BP history and validates source uniqueness") {
    val state=List[(Actor,String)](("A","chart-1"),("B","chart-2"),("A","chart-3"),("B","chart-4"),("referee","chart-5")).foldLeft(DraftState(Nil))((s,a)=>Engine.applyDraftAction(r,charts,s,a._1,a._2).toOption.get)
    assertEquals(Engine.buildPlayOrder(r.copy(playOrder=r.playOrder.reverse),state).map(_._2),List("chart-5","chart-4","chart-3"))
    assert(!Engine.validate(r.copy(playOrder=r.playOrder.updated(1,r.playOrder(1).copy(source=r.playOrder.head.source))),charts).valid)
  }
  test("total-score mode never ends early after two chart wins") {
    assertEquals(Engine.compare(r,List(BigDecimal(9),BigDecimal(9)),List(BigDecimal(8),BigDecimal(8)),0),Decision.Pending("等待全部有效成绩"))
  }
  test("one ten-thousandth changes the winner without floating point rounding") {
    val a=List(BigDecimal("100.0001"),BigDecimal(99),BigDecimal(98))
    val b=List(BigDecimal("100.0000"),BigDecimal(99),BigDecimal(98))
    assert(Engine.compare(r,a,b,0).isInstanceOf[Decision.Winner])
  }
  test("ties remain unresolved or create bounded extra rounds, never ID-based wins") {
    val s=List.fill(3)(BigDecimal(99))
    assertEquals(Engine.compare(r,s,s,0),Decision.ExtraRound("extra-only"))
    assert(Engine.compare(r,s,s,3).isInstanceOf[Decision.Pending])
  }
  private def attempt(id:String,n:Long,values:List[String],status:AttemptStatus="approved")=Attempt(id,"entry",status,n,values.zipWithIndex.map((v,i)=>ScoreItem(s"slot-$i",v)))
  test("whole-attempt best cannot combine scores from separate attempts") {
    val a=List(attempt("one",1,List("100","80")),attempt("two",2,List("80","100")))
    val whole=Engine.selectEffectiveAttempt(r,List("slot-0","slot-1"),a).get
    assertEquals(whole.total.map(BigDecimal(_)),Some(BigDecimal(180)))
    assertEquals(whole.attemptIds.size,1)
    val per=Engine.selectEffectiveAttempt(r.copy(qualifierSelection="per-chart-best"),List("slot-0","slot-1"),a).get
    assertEquals(per.total.map(BigDecimal(_)),Some(BigDecimal(200)))
  }
  test("pending policy retains or hides old score; rejected new attempt restores it") {
    val a=List(attempt("old",1,List("99")),attempt("new",2,List("100"),"pending"))
    assert(Engine.selectEffectiveAttempt(r,List("slot-0"),a).get.complete)
    assert(!Engine.selectEffectiveAttempt(r.copy(pendingPolicy="hide"),List("slot-0"),a).get.complete)
    assert(Engine.selectEffectiveAttempt(r.copy(pendingPolicy="hide"),List("slot-0"),a.map(x=>if x.id=="new" then x.copy(status="rejected") else x)).get.complete)
  }
  test("incomplete submission does not become zero; last approved differs from best") {
    assert(!Engine.selectEffectiveAttempt(r,List("slot-0","slot-1"),List(attempt("one",1,List("100")))).get.complete)
    val a=List(attempt("one",1,List("100")),attempt("two",2,List("99")))
    assertEquals(Engine.selectEffectiveAttempt(r.copy(qualifierSelection="last-approved"),List("slot-0"),a).get.total,Some("99"))
  }
  test("3, 5, 8 entrant brackets retain every entrant exactly once with high-seed byes") {
    List(3,5,8).foreach { count =>
      val entries=(1 to count).toList.map(i=>EntryId(s"e$i"))
      val pairs=Engine.bracket(entries)
      assertEquals(pairs.flatMap(p=>List(p._1,p._2).flatten).toSet,entries.toSet)
      assertEquals(pairs.flatMap(p=>List(p._1,p._2).flatten).size,count)
      if count==3 || count==5 then assertEquals(pairs.head,(Some(entries.head),None))
    }
  }
  test("new competition types are supported and unknown options are rejected") {
    assert(EntryMode.fromString("unknown").isLeft)
    assert(Engine.validate(r.copy(stages=List(Stage("d","双败","double",1))),charts).valid)
    assert(Engine.validate(r.copy(matchMode="first-to"),charts).valid)
  }

  test("first-to stops at the earliest winning prefix; later unused charts cannot reverse it") {
    val first=r.copy(matchMode="first-to",winsRequired=2,playOrder=List.tabulate(5)(i=>PlaySlot(s"$i",s"$i")))
    assertEquals(Engine.compare(first,List(9,9,1,1,1).map(BigDecimal(_)),List(8,8,9,9,9).map(BigDecimal(_)),0),Decision.Winner("A","18","16"))
    assertEquals(Engine.compare(first.copy(initialWinsA=Some(1)),List(BigDecimal(9)),List(BigDecimal(8)),0),Decision.Winner("A","9","8"))
  }

  test("standalone ranking supports a qualifier-only pool without unused BP or match songs") {
    val ranking=r.copy(stages=List(Stage("ranking","独立排名","ranking",1)),draft=Nil,playOrder=Nil,resolution=r.resolution.copy(tie="manual"))
    assert(Engine.validate(ranking,charts.filter(_.pool_tag=="qualifier")).valid)
    assert(Engine.summary(ranking).exists(_.contains("排名赛 / 海选 / 刷分赛")))
  }
