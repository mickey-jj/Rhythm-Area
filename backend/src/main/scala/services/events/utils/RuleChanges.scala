package services.events.utils
import services.events.objects.*

private[events] object RuleChanges:
  private[events] def affectsSchedule(before: RuleSet, after: RuleSet, oldCharts: List[Chart], newCharts: List[Chart]): Boolean =
    val team=after.team.copy(captainSelection=before.team.captainSelection,formation=before.team.formation,captainCount=before.team.captainCount,draftOrder=before.team.draftOrder)
    val comparable = after.copy(gameName=before.gameName,clientVersion=before.clientVersion,capacity=before.capacity,windows=before.windows,team=team)
    val memberships = (charts: List[Chart]) => charts.map(c => (c.chart_key,c.game_key,Engine.pools(c),Engine.roles(c))).toSet
    scheduleRules(before) != scheduleRules(comparable) || memberships(oldCharts) != memberships(newCharts)

  private[events] def scheduleRules(r: RuleSet): RuleSet =
    val stages=r.stages.map { s =>
      val p=s.effective(r)
      s.copy(name="",ranking=None,plan=if s.kind=="ranking" then None else Some(StagePlan(p.metric,p.matchMode,p.winsRequired,p.draft,p.playOrder,p.resolution,Some(p.draftMode.getOrElse("open")),Some(p.tieBreak.getOrElse(Nil)),None)))
    }
    r.copy(stages=stages,metric=if r.stages.exists(_.kind=="ranking") then r.metric else Defaults.rules.metric,matchMode="total",winsRequired=2,draft=Nil,playOrder=Nil,resolution=Defaults.rules.resolution,draftMode=None,tieBreak=None,windows=None,timing=None)

  private[events] def losses(outcomes: Map[String,Outcome], initial: Map[String,Int]): Map[String,Int] =
    outcomes.values.filter(_.status=="finalized").foldLeft(initial) { (acc,o) =>
      List(o.a,o.b).flatten.filterNot(o.winner.contains).foldLeft(acc)((counts,id)=>counts.updated(id,counts.getOrElse(id,0)+1))
    }

  private[events] def remaining(kind: StageKind, participants: List[String], losses: Map[String,Int]): List[String] = kind match
    case "single" => participants.filter(id=>losses.getOrElse(id,0)<1)
    case "double" => participants.filter(id=>losses.getOrElse(id,0)<2)
    case _ => participants

  private[events] def doubleFixtures(participants: List[String], initialLosses: Map[String,Int]): List[Fixture] =
    val unbeaten=participants.filter(id=>initialLosses.getOrElse(id,0)==0)
    val lower=participants.filter(id=>initialLosses.getOrElse(id,0)>0).map("entry:"+_)
    val winners=if unbeaten.size>=2 then Tournament.single(unbeaten) else Nil
    val winnerSource=if unbeaten.size==1 then "entry:"+unbeaten.head else winners.sortBy(-_.round).headOption.map(f=>"winner:"+f.key).getOrElse("empty")
    val lowerSources=lower ++ winners.map(f=>"loser:"+f.key)
    val losers=if lowerSources.size<2 then Nil else Tournament.single(lowerSources).map { f =>
      val ref=(value:String)=>if value.startsWith("entry:") then value.drop(6) else value.replace(":W",":L")
      f.copy(key=f.key.replaceFirst("^W","L"),bracket="losers",a=ref(f.a),b=ref(f.b))
    }
    val lowerWinner=if lowerSources.size==1 then lowerSources.head else losers.sortBy(-_.round).headOption.map(f=>"winner:"+f.key).getOrElse("empty")
    winners ++ losers :+ Fixture(if unbeaten.isEmpty then "F2" else "F1",winners.size+losers.size+1,0,if unbeaten.isEmpty then "reset" else "final",winnerSource,lowerWinner)
