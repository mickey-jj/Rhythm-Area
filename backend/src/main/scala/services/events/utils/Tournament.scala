package services.events.utils

import cats.effect.{IO, Resource}
import cats.syntax.all.*
import java.sql.Connection
import java.nio.file.{Files, Path}
import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import services.system.api.*
import services.system.utils.*
private[events] object Tournament:
  val terminal = Set("finalized", "bye", "empty", "cancelled")
  private[events] def single(ids: List[String]): List[Fixture] =
    val pairs = Engine.bracket(ids.map(EntryId(_)))
    val rounds = Integer.numberOfTrailingZeros(pairs.size * 2)
    (1 to rounds).toList.flatMap { r =>
      (0 until (pairs.size / (1 << (r - 1)))).toList.map { i =>
        val pair = pairs.lift(i)
        def source(side: Int): String = if r == 1 then
          pair.flatMap(p => if side == 0 then p._1 else p._2).map(e => "entry:" + e.value).getOrElse("empty")
          else s"winner:W${r-1}-${i*2+side}"
        Fixture(s"W$r-$i",r,i,"winners",source(0),source(1))
      }
    }
  private[events] def doubleElimination(ids: List[String]): List[Fixture] =
    val winners = single(ids)
    val k = winners.map(_.round).max
    val size = 1 << k
    val losers = if k == 1 then Nil else (1 to (2*k-2)).toList.flatMap { r =>
      val count = size / (1 << ((r+3)/2))
      (0 until count).toList.map { i =>
        val (a,b) = if r == 1 then (s"loser:W1-${i*2}",s"loser:W1-${i*2+1}")
          else if r % 2 == 0 then (s"winner:L${r-1}-$i",s"loser:W${r/2+1}-${count-1-i}")
          else (s"winner:L${r-1}-${i*2}",s"winner:L${r-1}-${i*2+1}")
        Fixture(s"L$r-$i",r,i,"losers",a,b)
      }
    }
    val lower = if k == 1 then "loser:W1-0" else s"winner:L${2*k-2}-0"
    winners ++ losers :+ Fixture("F1",k*2+1,0,"final","winner:W"+k+"-0",lower)
  private[events] def roundRobin(ids: List[String]): List[Fixture] =
    val padded = ids.map(Some(_)) ++ Option.when(ids.size % 2 == 1)(None).toList
    val rotations = List.iterate(padded,padded.size-1)(xs => xs.head :: xs.last :: xs.tail.init)
    rotations.zipWithIndex.flatMap { (row,r) =>
      row.take(row.size/2).zip(row.takeRight(row.size/2).reverse).zipWithIndex.collect {
        case ((Some(a),Some(b)),i) => Fixture(s"R${r+1}-$i",r+1,i,"round-robin","entry:"+a,"entry:"+b)
      }
    }
  private[events] def fixtures(kind: String, ids: List[String]): List[Fixture] = kind match
    case "double" => doubleElimination(ids)
    case "round-robin" => roundRobin(ids)
    case _ => single(ids)

  // A power-of-two qualifying cutoff ends once that many bracket winners remain.
  // Other cutoffs use completed placements and the existing boundary-tie procedure.
  private[events] def stageFixtures(stage: Stage, ids: List[String]): List[Fixture] =
    val fs = fixtures(stage.kind,ids)
    if stage.kind=="single" && stage.advance>1 && (stage.advance & (stage.advance-1))==0 then
      val remainingRounds = Integer.numberOfTrailingZeros(stage.advance)
      val lastRound = fs.map(_.round).maxOption.getOrElse(0)-remainingRounds
      fs.filter(_.round<=lastRound)
    else fs

  // None means unresolved; Some(None) means a proven empty source.
  private[events] def source(ref: String, outcomes: Map[String,Outcome]): Option[Option[String]] =
    if ref == "empty" then Some(None)
    else if ref.startsWith("entry:") then Some(Some(ref.drop(6)))
    else
      val key = ref.dropWhile(_ != ':').drop(1)
      outcomes.get(key).filter(o => terminal(o.status)).map { o =>
        if ref.startsWith("winner:") then o.winner
        else o.winner.flatMap(w => List(o.a,o.b).flatten.find(_ != w))
      }

  private[events] def settle(fixtures: List[Fixture], initial: Map[String,Outcome]): Map[String,Outcome] =
    // Bounded fixed point handles winners/losers graphs regardless of display order.
    def pass(state: Map[String,Outcome]): Map[String,Outcome] = fixtures.foldLeft(state) { (acc,f) =>
      if acc.get(f.key).exists(o => terminal(o.status) || o.status != "waiting") then acc
      else (source(f.a,acc),source(f.b,acc)) match
        case (Some(a),Some(b)) =>
          val status: MatchStatus = if a.isDefined && b.isDefined then "drafting" else if a.isDefined || b.isDefined then "bye" else "empty"
          acc.updated(f.key,Outcome(f.key,a,b,Option.when(status == "bye")(a.orElse(b)).flatten,status))
        case _ => acc
    }
    def loop(state: Map[String,Outcome], remaining: Int): Map[String,Outcome] =
      val next = pass(state)
      if next == state || remaining == 0 then next else loop(next,remaining-1)
    loop(initial,fixtures.size+1)

  private[events] def placements(kind: String, ids: List[String], fixtures: List[Fixture], outcomes: Map[String,Outcome], initialLosses: Map[String,Int] = Map.empty): List[Placement] =
    val champion = outcomes.get("F2").orElse(outcomes.get("F1")).orElse(fixtures.filter(_.bracket=="winners").sortBy(-_.round).headOption.flatMap(f=>outcomes.get(f.key))).flatMap(_.winner)
    val played = outcomes.values.filter(o => o.status == "finalized").toList
    val eliminated = played.flatMap(o=>List(o.a,o.b).flatten.filterNot(o.winner.contains)).toSet
    val survivors = if kind=="single" then ids.filterNot(eliminated).toSet else Set.empty[String]
    val stats = ids.map { id =>
      val wins = played.count(_.winner.contains(id))
      val losses = played.count(o => (o.a.contains(id) || o.b.contains(id)) && !o.winner.contains(id)) + initialLosses.getOrElse(id,0)
      val lastRound = fixtures.filter(f => outcomes.get(f.key).exists(o => o.status == "finalized" && (o.a.contains(id) || o.b.contains(id)))).map(f => if f.bracket == "final" || f.bracket == "reset" then 10000 else if f.bracket == "losers" then f.round*2 else f.round).maxOption.getOrElse(0)
      // Byes change the number of actual wins. They must not split equal elimination places.
      val key = if kind=="single" && survivors(id) then (1000,0,0) else if kind == "round-robin" then (wins, -losses, 0) else (if champion.contains(id) then 1000 else -losses,lastRound,0)
      (id,wins,losses,key)
    }.sortBy(x => (-x._4._1,-x._4._2,-x._4._3))
    stats.map { (id,w,l,key) => Placement(id,stats.indexWhere(_._4 == key)+1,w,l) }
