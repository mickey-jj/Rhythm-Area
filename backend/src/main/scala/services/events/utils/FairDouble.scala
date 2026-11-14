package services.events.utils
import services.events.objects.*
import services.events.objects.apiTypes.EliminationGroup

private[events] object FairDouble:
  private[events] def plan(ids: List[String]): EliminationPlan =
    val standard=Tournament.doubleElimination(ids)
    val size=Integer.highestOneBit((ids.size-1).max(1))*2
    val rounds=standard.filter(_.bracket=="losers").map(_.round).distinct.sorted
    val initial=ids.size-size/2
    val counts=rounds.foldLeft((initial,List.empty[(Int,Int,Int)])) { case ((previous,rows),round) =>
      val target=size/(1<<((round+3)/2))
      val incoming=if round==1 || round%2==1 then previous else previous+size/(1<<(round/2+1))
      (incoming.min(target),rows :+ (round,incoming,target))
    }._2
    val groups=counts.collect { case (round,incoming,target) if target>=2 && incoming>target && incoming<target*2 =>
      EliminationGroupPlan(s"Q$round",round,target,standard.filter(f=>f.bracket=="losers" && f.round==round).flatMap(f=>List(f.a,f.b)),incoming)
    }
    val replace=(ref:String)=>groups.foldLeft(ref)((value,g)=>(0 until g.advance).foldLeft(value)((v,i)=>if v==s"winner:L${g.round}-$i" then s"winner:${g.key}-$i" else v))
    EliminationPlan(standard.filterNot(f=>f.bracket=="losers" && groups.exists(_.round==f.round)).map(f=>f.copy(a=replace(f.a),b=replace(f.b))),groups.map(g=>g.copy(sources=g.sources.map(replace))))

  // Qualification places feed the existing lower-bracket slots. Only elimination adds a loss.
  private[events] def state(group: EliminationGroup): (List[Fixture],Map[String,Outcome]) =
    val marker=Outcome("group:"+group.key,None,None,None,if group.status=="completed" then "empty" else "waiting")
    val qualified=if group.status!="completed" then Nil else group.placements.take(group.advance).zipWithIndex.map((id,i)=>Outcome(s"${group.key}-$i",Some(id),None,Some(id),"bye"))
    val eliminated=if group.status!="completed" then Nil else group.placements.drop(group.advance).zipWithIndex.map { (id,i) =>
      val key=s"${group.key}-eliminated-$i"
      (Fixture(key,group.round,i,"losers","entry:"+id,"empty"),Outcome(key,Some(id),None,None,"finalized"))
    }
    (eliminated.map(_._1),(marker :: qualified ++ eliminated.map(_._2)).map(o=>o.key->o).toMap)
