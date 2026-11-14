package services.events.utils
import services.events.objects.*
import services.events.objects.apiTypes.RankingRow

private[events] object RankingLogic:
  private[events] def policy(r: RuleSet, stage: Stage): RankingPolicy = stage.ranking.getOrElse(RankingPolicy("publish",if r.windows.flatMap(_.qualifierClose).nonEmpty then "fixed" else "manual",None,r.windows.flatMap(_.qualifierClose),None,None,None))
  private[events] def timestamp(value: Option[String]): Option[Long] = value.flatMap(TimeValue.epoch).map(_*1000)
  private[events] def reached(r: RuleSet, policy: RankingPolicy, rows: List[RankingRow]): Int =
    rows.filter(row=>row.complete && row.total.flatMap(Engine.decimal).zip(policy.targetScore.flatMap(Engine.decimal)).exists((score,target)=>if r.metric.higherWins then score>=target else score<=target)).map(_.entry.id).distinct.size
  private[events] def progress(current: RankingSession, policy: RankingPolicy, now: Long, qualified: Int, eventStatus: EventStatus): RankingSession =
    if current.status=="closed" then current
    else
      val start=current.startedAt.orElse(Option.when(eventStatus=="registration" && (policy.startMode=="publish" || policy.startMode=="scheduled" && timestamp(policy.startAt).exists(_<=now)))(if policy.startMode=="scheduled" then timestamp(policy.startAt).get else now))
      val end=policy.endMode match
        case "fixed" => timestamp(policy.deadline)
        case "duration" => start.zip(policy.durationSeconds).map((at,seconds)=>at+seconds.toLong*1000)
        case _ => None
      val reason: Option[RankingStopReason] =
        if eventStatus!="registration" && eventStatus!="draft" then Some("advanced")
        else if end.exists(_<=now) then Some("deadline")
        else if start.nonEmpty && policy.endMode=="threshold" && policy.targetCount.exists(_<=qualified) then Some("threshold")
        else None
      current.copy(policy=policy,startedAt=start,endsAt=end,status=if reason.nonEmpty then "closed" else if start.nonEmpty then "open" else "waiting",closedAt=reason.map(_=>end.filter(_<=now).getOrElse(now)),stopReason=reason)
  private[events] def validate(r: RuleSet, stage: Stage, charts: List[Chart]): List[Issue] = stage.ranking.toList.flatMap { p =>
    val count=charts.count(c=>Engine.inPool(c,"qualifier"))
    val factor=if r.entryMode=="team" && r.team.aggregation=="sum" then r.team.perChart else 1
    val target=p.targetScore.flatMap(Engine.decimal)
    List(
      Option.when(p.startMode=="scheduled" && timestamp(p.startAt).isEmpty)(Issue("startAt","请选择排名赛开始时间")),
      Option.when(p.endMode=="fixed" && timestamp(p.deadline).isEmpty)(Issue("deadline","请选择固定截止时间")),
      Option.when(p.startMode=="scheduled" && p.endMode=="fixed" && timestamp(p.startAt).zip(timestamp(p.deadline)).exists((a,b)=>a>=b))(Issue("deadline","截止时间须晚于排名赛开始时间")),
      Option.when(p.endMode=="duration" && !p.durationSeconds.exists(n=>n>=1 && n<=31536000))(Issue("durationSeconds","排名赛时长须为 1 秒至 365 天")),
      Option.when(p.endMode=="threshold" && !p.targetCount.exists(n=>n>=stage.advance && n<=r.capacity))(Issue("targetCount",s"达标方数须在晋级名额 ${stage.advance} 至报名容量 ${r.capacity} 之间")),
      Option.when(p.endMode=="threshold" && !target.exists(n=>n.scale<=r.metric.decimals && Engine.decimal(r.metric.minimum).exists(n>=_*count*factor) && Engine.decimal(r.metric.maximum).exists(n<=_*count*factor)))(Issue("targetScore","达标总成绩须在本阶段所有曲目的总分范围内"))
    ).flatten.map(i=>i.copy(fieldPath=s"stages.${stage.id}.ranking.${i.fieldPath}"))
  }
