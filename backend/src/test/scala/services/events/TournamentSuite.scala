package services.events
import services.events.objects.*
import services.events.objects.given
import services.events.utils.*

class TournamentSuite extends munit.FunSuite:
  private def ids(n: Int) = (1 to n).toList.map(i => s"p$i")
  test("qualifying single stages stop at their 2/4/8/16 survivor cutoff for arbitrary entrants") {
    (2 to 256).foreach { n =>
      List(2,4,8,16).filter(_<=n).foreach { k =>
        val fs=Tournament.stageFixtures(Stage("cut","晋级", "single",k),ids(n))
        val outcomes=play(fs)
        assertEquals(outcomes.values.count(_.status=="finalized"),n-k,s"$n → $k")
        assertEquals(Tournament.placements("single",ids(n),fs,outcomes).count(_.rank==1),k,s"$n → $k")
      }
    }
  }
  private def play(fs: List[services.events.objects.Fixture], initial: Map[String,Outcome] = Map.empty): Map[String,Outcome] =
    val state = Tournament.settle(fs,initial)
    state.values.find(_.status=="drafting") match
      case Some(o) => play(fs,state.updated(o.key,o.copy(status="finalized",winner=o.a)))
      case None => state
  test("every supported single-elimination size 2–256 keeps every entrant once, high seeds receive byes") {
    (2 to 256).foreach { n =>
      val entrants=ids(n)
      val pairs=Engine.bracket(entrants.map(EntryId(_)))
      assertEquals(pairs.flatMap(p=>List(p._1,p._2).flatten.map(_.value)).sorted,entrants.sorted)
      val fs=Tournament.single(entrants)
      val outcomes=play(fs)
      assert(outcomes.values.forall(o=>Tournament.terminal(o.status)),s"stalled at $n")
      assertEquals(outcomes.values.count(_.status=="finalized"),n-1)
    }
  }
  test("every double-elimination size 2–256 resolves both brackets and a real final without fake losses") {
    (2 to 256).foreach { n =>
      val fs=Tournament.doubleElimination(ids(n))
      val outcomes=play(fs)
      assert(outcomes.values.forall(o=>Tournament.terminal(o.status)),s"stalled at $n")
      val losses=outcomes.values.filter(_.status=="finalized").toList.flatMap(o=>List(o.a,o.b).flatten.filterNot(o.winner.contains)).groupMapReduce(identity)(_=>1)(_+_)
      val finalResult=outcomes("F1")
      assertEquals(finalResult.a,finalResult.winner)
      assertEquals(ids(n).filterNot(finalResult.winner.contains).map(id=>losses.getOrElse(id,0)).distinct,List(2))
    }
  }
  test("round robin 2–256 includes every unordered pair exactly once, no same-round double booking") {
    (2 to 256).foreach { n =>
      val fs=Tournament.roundRobin(ids(n))
      assertEquals(fs.size,n*(n-1)/2)
      assertEquals(fs.map(f=>Set(f.a,f.b)).distinct.size,fs.size)
      fs.groupBy(_.round).values.foreach { round =>
        val participants=round.flatMap(f=>List(f.a,f.b))
        assertEquals(participants.distinct.size,participants.size)
      }
    }
  }
  test("elimination placements do not break same-round ties by wins earned before a bye") {
    List("single", "double").foreach { kind =>
      (3 to 32).foreach { n =>
        val fs = Tournament.fixtures(kind, ids(n))
        val outcomes = play(fs)
        val places = Tournament.placements(kind, ids(n), fs, outcomes)
        val eliminated = fs.filter(f => kind == "single" || f.bracket == "losers").flatMap { f =>
          outcomes.get(f.key).filter(_.status == "finalized").toList.flatMap(o =>
            List(o.a, o.b).flatten.filterNot(o.winner.contains).map(id => (f.round, id)))
        }
        eliminated.groupBy(_._1).values.foreach { sameRound =>
          assertEquals(sameRound.map((_, id) => places.find(_.entryId == id).get.rank).distinct.size, 1, s"$kind $n")
        }
      }
    }
  }
  test("invalid downstream quotas and final quotas are rejected") {
    val charts=(1 to 20).toList.map(i=>Chart("custom-rhythm","v",s"s$i",s"S$i","",s"c$i","standard","X",None,if i<12 then "main" else if i<16 then "qualifier" else "extra","",i))
    assert(!Engine.validate(Defaults.rules.copy(capacity=3),charts).valid)
    assert(!Engine.validate(Defaults.rules.copy(stages=List(Stage("one","one","single",4))),charts).valid)
    assert(Engine.validate(Defaults.rules.copy(capacity=3,stages=List(Stage("one","one","double",1))),charts).valid)
  }
