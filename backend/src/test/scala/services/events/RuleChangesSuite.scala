package services.events
import services.events.objects.*
import services.events.utils.*

class RuleChangesSuite extends munit.FunSuite:
  private def play(fs: List[services.events.objects.Fixture], initial: Map[String,Outcome] = Map.empty): Map[String,Outcome] =
    val state=Tournament.settle(fs,initial)
    state.values.find(_.status=="drafting") match
      case Some(o) => play(fs,state.updated(o.key,o.copy(status="finalized",winner=o.a)))
      case None => state

  test("single and double replans retain survivors without reviving eliminated entrants") {
    val ids=List("a","b","c","d")
    val losses=Map("a"->0,"b"->1,"c"->2)
    assertEquals(RuleChanges.remaining("single",ids,losses),List("a","d"))
    assertEquals(RuleChanges.remaining("double",ids,losses),List("a","b","d"))
    assertEquals(RuleChanges.remaining("round-robin",ids,losses),ids)
  }

  test("double replans carry one-loss entrants into the lower bracket for every mixed 2–16 survivor group") {
    (2 to 16).foreach { n =>
      val ids=(1 to n).map(i=>s"p$i").toList
      (0 to n).foreach { lowerCount =>
        val initial=ids.take(lowerCount).map(_->1).toMap
        val fixtures=RuleChanges.doubleFixtures(ids,initial)
        val outcomes=play(fixtures)
        assert(outcomes.values.forall(o=>Tournament.terminal(o.status)),s"stalled: $n / $lowerCount")
        val champion=outcomes.get("F2").orElse(outcomes.get("F1")).flatMap(_.winner)
        assert(champion.nonEmpty)
        val losses=RuleChanges.losses(outcomes,initial)
        assert(ids.filterNot(champion.contains).forall(id=>losses.getOrElse(id,0)==2),s"lost history: $n / $lowerCount")
        assert(losses.getOrElse(champion.get,0)<=1)
        assert(Tournament.placements("double",ids,fixtures,outcomes,initial).filterNot(p=>champion.contains(p.entryId)).forall(_.losses==2))
      }
    }
  }
