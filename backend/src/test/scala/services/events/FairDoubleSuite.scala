package services.events
import services.events.objects.*
import services.events.objects.apiTypes.EliminationGroup
import services.events.utils.*

class FairDoubleSuite extends munit.FunSuite:
  private def play(plan: EliminationPlan, initial: Map[String,Outcome] = Map.empty, completed: Set[String] = Set.empty, eliminated: List[services.events.objects.Fixture] = Nil, reverse: Boolean = false): (List[services.events.objects.Fixture],Map[String,Outcome]) =
    val state=Tournament.settle(plan.fixtures,initial)
    val ready=plan.groups.find(g=> !completed(g.key) && g.sources.forall(ref=>Tournament.source(ref,state).nonEmpty))
    ready match
      case Some(g) =>
        val participants=g.sources.flatMap(ref=>Tournament.source(ref,state).flatten)
        assert(participants.size>g.advance && participants.size<g.advance*2)
        assertEquals(participants.size,g.expectedParticipants)
        assertEquals(participants.distinct.size,participants.size)
        val group=EliminationGroup("g","e","s","阶段",g.key,g.round,g.advance,g.sources,participants,"completed",Nil,Defaults.rules,if reverse then participants.reverse else participants,1,ScheduleState.Current,"")
        val virtual=FairDouble.state(group)
        play(plan,state ++ virtual._2,completed+g.key,eliminated ++ virtual._1,reverse)
      case None => state.values.find(_.status=="drafting") match
        case Some(o) => play(plan,state.updated(o.key,o.copy(status="finalized",winner=if reverse then o.b else o.a)),completed,eliminated,reverse)
        case None => (plan.fixtures ++ eliminated,state)

  test("non-power double brackets settle every size 2–256 with exactly two losses per eliminated entrant") {
    (2 to 256).foreach { n =>
      val ids=(1 to n).map(i=>s"p$i").toList
      val plan=FairDouble.plan(ids)
      val (fs,outcomes)=play(plan)
      assert(outcomes.values.forall(o=>Tournament.terminal(o.status)),s"stalled at $n")
      val placements=Tournament.placements("double",ids,fs,outcomes)
      assertEquals(placements.count(_.rank==1),1,s"$n")
      assert(placements.filter(_.rank!=1).forall(_.losses==2),s"$n: $placements")
      if (n & (n-1))==0 then assertEquals(plan,EliminationPlan(Tournament.doubleElimination(ids),Nil))
    }
  }
  test("seven entrants change only lower round one into three-to-two and keep the eight-slot winners/final structure") {
    val ids=(1 to 7).map(i=>s"p$i").toList
    val standard=Tournament.doubleElimination(ids)
    val plan=FairDouble.plan(ids)
    assertEquals(plan.groups.map(g=>(g.round,g.advance)),List((1,2)))
    assertEquals(plan.fixtures.filter(f=>f.bracket=="winners" || f.bracket=="final"),standard.filter(f=>f.bracket=="winners" || f.bracket=="final"))
    assertEquals(plan.fixtures.filter(_.bracket=="losers").map(_.key),List("L2-0","L2-1","L3-0","L4-0"))
    val (_,outcomes)=play(plan)
    assertEquals(outcomes.values.count(o=>o.key.startsWith("Q1-eliminated")),1)
  }
