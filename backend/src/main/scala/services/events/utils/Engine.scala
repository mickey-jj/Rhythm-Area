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
private[events] object Engine:
  private[events] def pools(c: Chart): Set[String] = c.pool_tag.split("[|,]").map(_.trim).filter(_.nonEmpty).toSet
  private[events] def inPool(c: Chart, tag: String): Boolean = pools(c).contains(tag.trim)
  private[events] def decimal(value: String): Option[BigDecimal] =
    Option.when(value.matches("-?(0|[1-9][0-9]*)(\\.[0-9]+)?"))(value).flatMap(v => io.circe.parser.parse(v).toOption.flatMap(_.asNumber.flatMap(_.toBigDecimal)))

  private[events] def validateScore(value: String, metric: Metric): Either[Issue, BigDecimal] =
    decimal(value).filter(n => n.scale <= metric.decimals && decimal(metric.minimum).exists(n >= _) && decimal(metric.maximum).exists(n <= _))
      .toRight(Issue("score", s"${metric.name}须在 ${metric.minimum}–${metric.maximum}，最多 ${metric.decimals} 位小数"))

  private[events] def summary(r: RuleSet): List[String] =
    val stages=r.stages.map { s =>
      val p=s.effective(r)
      if s.kind=="ranking" then s"${s.name} · 排名赛 / 海选 / 刷分赛 · 前 ${s.advance} 方"
      else s"${s.name} · ${p.playOrder.size} 首 · ${p.metric.name} · ${if p.matchMode=="total" then "总成绩" else s"先到 ${p.winsRequired} 个曲胜"}"
    }
    s"${r.gameName} · ${r.clientVersion} · ${if r.entryMode=="solo" then "个人赛" else "团队赛"} · 最多 ${r.capacity} ${if r.entryMode=="solo" then "人" else "队"}" :: stages

  private[events] def validate(r: RuleSet, charts: List[Chart]): Validation =
    val issues = r.timing.toList.flatMap(t=>List(Option.when(t.draftSeconds<1 || t.draftSeconds>86400)(Issue("timing.draftSeconds","BP 时限须为 1–86400 秒")),Option.when(t.chartSeconds<1 || t.chartSeconds>86400)(Issue("timing.chartSeconds","交分时限须为 1–86400 秒"))).flatten) ++ List(
      Option.when(r.schemaVersion != 1)(Issue("schemaVersion", "不支持的规则版本")),
      Option.when(r.gameKey.trim.isEmpty || r.gameName.trim.isEmpty)(Issue("gameKey", "请填写游戏标识与名称")),
      Option.when(!Set("solo", "team").contains(r.entryMode))(Issue("entryMode", "参赛类型无效")),
      Option.when(r.capacity < 2 || r.capacity > 256)(Issue("capacity", "名额须在 2–256")),
      Option.when(r.metric.decimals < 0 || r.metric.decimals > 6 || !decimal(r.metric.minimum).exists(n => decimal(r.metric.maximum).exists(_ > n)))(Issue("metric", "指标范围或精度无效")),
      Option.when(!Set("whole-best", "per-chart-best", "last-approved").contains(r.qualifierSelection))(Issue("qualifierSelection", "不支持的取分策略")),
      Option.when(!Set("retain", "hide").contains(r.pendingPolicy))(Issue("pendingPolicy", "不支持的待审策略")),
      Option.when(!Set("total", "first-to").contains(r.matchMode) || (r.matchMode == "first-to" && r.winsRequired < 1))(Issue("matchMode", "不支持的计分方式或胜场数")),
      Option.when(r.playOrder.isEmpty)(Issue("playOrder", "至少配置一个演奏槽")),
      Option.when(r.playOrder.map(_.id).distinct.size != r.playOrder.size)(Issue("playOrder", "曲目槽 ID 重复")),
      Option.when(r.playOrder.map(_.source).distinct.size != r.playOrder.size)(Issue("playOrder", "同一个选曲槽不能重复演奏")),
      Option.when(r.draft.map(_.id).distinct.size != r.draft.size)(Issue("draft", "步骤 ID 重复")),
      Option.when(charts.isEmpty)(Issue("pools", "发布前请添加图池")),
      Option.when(r.stages.exists(_.kind == "ranking") && !charts.exists(c => inPool(c, "qualifier")))(Issue("pools.qualifier", "启用海选时至少配置一张 qualifier 子池谱面")),
      Option.when(charts.exists(_.game_key != r.gameKey))(Issue("pools", "图池包含其他游戏的谱面")),
      Option.when(charts.map(_.chart_key).distinct.size != charts.size)(Issue("pools", "图池包含重复谱面键")),
      Option.when(r.stages.isEmpty || r.stages.exists(s => !Set("ranking", "single", "double", "round-robin").contains(s.kind)))(Issue("stages", "支持海选、单败、双败和单循环")),
      Option.when(r.stages.map(_.id).distinct.size != r.stages.size || r.stages.exists(s => s.advance < 1 || s.advance > r.capacity))(Issue("stages", "阶段 ID 或晋级数无效")),
      Option.when(r.stages.count(_.kind == "ranking") > 1 || r.stages.drop(1).exists(_.kind == "ranking") || r.stages.lastOption.exists(s => s.advance != 1 && !(r.stages.size == 1 && s.kind == "ranking")))(Issue("stages", "海选只能位于开头且最多一个；淘汰赛最终阶段晋级数必须为 1")),
      Option.when(r.matchMode == "first-to" && (r.winsRequired > r.playOrder.size || r.winsRequired * 2 - 1 > r.playOrder.size))(Issue("winsRequired", "先胜门槛须能在规定曲数内达到，至少安排 2K−1 曲")),
      Option.when(r.draftMode.exists(m => !Set("open","sealed").contains(m)))(Issue("draftMode", "选禁公开方式无效")),
      Option.when(charts.exists(c => !roles(c).subsetOf(Set("ban","pick","random","assign","extra","qualifier","mystery","fixed"))))(Issue("pools.role", "包含未知谱面用途")),
      Option.when(!Set("extra", "manual").contains(r.resolution.tie) || !Set("extra-only", "cumulative").contains(r.resolution.scope) || r.resolution.extraCount < 1 || r.resolution.maxExtraRounds < 1)(Issue("resolution", "加赛配置无效")),
      Option.when(!Set("normal","reset","advantage").contains(r.resolution.finalPolicy))(Issue("resolution.finalPolicy", "决赛策略须为普通、双败 reset 或胜者组一曲胜优势")),
      Option.when(r.entryMode == "team" && (r.team.min < 1 || r.team.max < r.team.min || r.team.max>256 || r.team.perChart < 1 || r.team.perChart > r.team.min || r.team.maxAppearances < 1 || !Set("sum", "average").contains(r.team.aggregation)))(Issue("team", "阵容人数或聚合方式不合法")),
      Option.when(r.entryMode == "team" && r.team.captainCount.exists(n=>n<2 || n>r.capacity))(Issue("team.captainCount","队长人数须为 2 至报名容量"))
    ).flatten
    val stepIssues = r.draft.flatMap(s => List(
      Option.when(!Set("ban", "pick", "random", "assign", "remove").contains(s.action) || !Set("A", "B", "referee").contains(s.actor) || s.count < 1 || s.count > 20)(Issue(s"draft.${s.id}", "步骤动作、行动方或数量无效")),
      Option.when(s.action == "assign" && s.actor != "referee")(Issue(s"draft.${s.id}.actor", "指定曲目只能由裁判执行")),
      Option.when(!Set("pool","picked").contains(s.target) || (s.action == "remove") != (s.target == "picked"))(Issue(s"draft.${s.id}.target", "删除动作必须针对已选曲，其余动作针对候选池")),
      Option.when(s.action != "remove" && charts.count(c => inPool(c, s.pool) && roles(c).contains(s.action)) < s.count)(Issue(s"draft.${s.id}.pool", "合法候选不足"))
    ).flatten)
    val slots = r.draft.filter(s => Set("pick", "random", "assign").contains(s.action)).flatMap(s => (1 to s.count).map(i => s"${s.id}:$i"))
    val referenceIssues = r.playOrder.filterNot(s => slots.contains(s.source) || (s.source.startsWith("fixed:") && charts.exists(c => c.chart_key==s.source.drop(6) && !roles(c).contains("mystery")))).map(s => Issue(s"playOrder.${s.id}", "引用了不存在的 Pick/Random/裁判指定 槽"))
    val unusedIssues = Option.when(slots.toSet != r.playOrder.filterNot(_.source.startsWith("fixed:")).map(_.source).toSet)(Issue("playOrder", "所有 Pick/Random/裁判指定 产出的槽都须且仅须安排一次演奏")).toList
    // Check worst-case exclusions at each step, rather than wrongly adding Ban and exempt Random counts.
    val capacityIssues = r.draft.zipWithIndex.flatMap { (step,index) =>
      val candidates = charts.filter(c=>inPool(c,step.pool) && roles(c).contains(step.action)).map(_.chart_key).toSet
      val prior = r.draft.take(index).filter { p =>
        val visible = !r.draftMode.contains("sealed") || p.actor==step.actor || p.actor=="referee"
        visible && (Set("pick","random","assign").contains(p.action) || (p.action=="ban" && (step.banApplies || step.action=="ban")))
      }
      val excluded = prior.map(p=>Math.min(p.count,charts.count(c=>inPool(c,p.pool) && roles(c).contains(p.action) && candidates(c.chart_key)))).sum
      Option.when(step.action!="remove" && candidates.size-excluded<step.count)(Issue(s"draft.${step.id}.pool","先前选禁可能耗尽本步骤候选；请增加图池、减少步骤或明确 Ban 豁免"))
    }
    val extraIssues = Option.when(r.resolution.tie == "extra" && charts.count(c => inPool(c, r.resolution.extraPool) && roles(c).contains("extra")) < r.resolution.extraCount)(Issue("resolution.extraPool", "加赛池不足" )).toList
    val stageLimits = r.stages.zipWithIndex.flatMap { (s,i) =>
      val incoming = if i == 0 then r.capacity else r.stages(i-1).advance
      List(Option.when(s.advance > incoming)(Issue(s"stages.${s.id}.advance",s"晋级数 ${s.advance} 不能超过上游名额 $incoming")),
        Option.when(i < r.stages.size-1 && s.advance < 2)(Issue(s"stages.${s.id}.advance","后续比赛至少需要两方参赛者")),
        Option.when(s.id.trim.isEmpty || s.name.trim.isEmpty)(Issue("stages","阶段标识与名称不能为空"))).flatten
    }
    val windowIssues = r.windows.toList.flatMap { w =>
      val values = List(w.registrationOpen,w.registrationClose,w.qualifierClose).flatten
      val parsed = values.flatMap(v => TimeValue.epoch(v))
      List(Option.when(parsed.size != values.size)(Issue("windows","时间必须是包含时区的 ISO 时间")),
        Option.when(w.registrationOpen.zip(w.registrationClose).exists((a,b) => TimeValue.epoch(a).zip(TimeValue.epoch(b)).exists((x,y) => x > y)))(Issue("windows","报名开始必须早于结束"))).flatten
    }
    val planIssues = r.stages.flatMap(s => s.plan.toList.flatMap(_ => validate(s.effective(r).copy(stages=List(s.copy(advance=1,plan=None))),charts).issues.map(i => i.copy(fieldPath=s"stages.${s.id}."+i.fieldPath))))
    val removeIssues = r.draft.zipWithIndex.flatMap { (s,index) =>
      val prior = r.draft.take(index).filter(x=>Set("pick","random","assign").contains(x.action) && x.actor!=s.actor)
      val available = prior.map(x=>Math.min(x.count,charts.count(c=>inPool(c,x.pool) && inPool(c,s.pool) && roles(c).contains(x.action)))).sum
      Option.when(s.action=="remove" && available < s.count)(Issue(s"draft.${s.id}","删除步骤之前没有足够的对手已选曲"))
    }
    val modeIssues = List(
      Option.when(r.resolution.finalPolicy=="advantage" && r.matchMode!="first-to")(Issue("resolution.finalPolicy","一曲胜优势只适用于先到 K 个曲胜")),
      Option.when(r.playOrder.size-r.draft.filter(_.action=="remove").map(_.count).sum < (if r.matchMode=="first-to" then 2*r.winsRequired-1 else 1))(Issue("playOrder","删除已选曲后，剩余曲数不足以执行整场规则")),
      Option.when(charts.exists(c=>roles(c).contains("mystery") && (roles(c).contains("pick") || roles(c).contains("ban") || roles(c).contains("qualifier") || roles(c).contains("fixed"))))(Issue("pools.role","隐藏曲请使用随机抽取或裁判指定用途，不能作为明选、固定引用或海选曲")),
      Option.when(r.draftMode.contains("sealed") && r.draft.exists(_.action=="remove"))(Issue("draftMode","密封选择不能同时删除未揭晓的对手已选曲")),
      Option.when(r.tieBreak.exists(_.exists(x => !Set("chart-wins","best-chart","worst-chart").contains(x))))(Issue("tieBreak","比较链包含未知条件"))
    ).flatten
    val rankingIssues=r.stages.filter(_.kind=="ranking").flatMap(s=>RankingLogic.validate(r,s,charts))
    val all = rankingIssues ++ removeIssues ++ modeIssues ++ stageLimits ++ windowIssues ++ planIssues ++ issues ++ stepIssues ++ referenceIssues ++ unusedIssues ++ capacityIssues ++ extraIssues
    val applicable = if r.stages.nonEmpty && (r.stages.forall(_.kind=="ranking") || r.stages.filter(_.kind!="ranking").forall(_.plan.nonEmpty)) then all.filterNot(i=>List("playOrder","draft","resolution","matchMode","winsRequired","tieBreak").exists(p=>i.fieldPath.startsWith(p))) else all
    Validation(applicable.isEmpty, applicable, summary(r))

  private[events] def roles(c: Chart): Set[String] = c.role.split("[|,]").map(_.trim).filter(_.nonEmpty).toSet match
    case s if s.isEmpty => Set("ban", "pick", "random", "extra")
    case s => s

  private[events] def currentStep(r: RuleSet, state: DraftState): Option[DraftStep] = r.draft.find(s => state.actions.count(_.stepId == s.id) < s.count)

  private[events] def eligibleCharts(r: RuleSet, charts: List[Chart], state: DraftState): List[Chart] =
    currentStep(r, state).toList.flatMap { s =>
      val visibleActions = if r.draftMode.contains("sealed") then state.actions.filter(a => a.actor == s.actor || a.actor == "referee") else state.actions
      val bans = visibleActions.filter(_.action == "ban").map(_.chartKey).toSet
      val removed = state.actions.filter(_.action == "remove").map(_.chartKey).toSet
      val picked = visibleActions.filter(a => Set("pick","random","assign").contains(a.action)).map(_.chartKey).toSet
      if s.action == "remove" then
        val targets = state.actions.filter(a => Set("pick","random","assign").contains(a.action) && a.actor != s.actor && !removed(a.chartKey)).map(_.chartKey).toSet
        charts.filter(c => targets(c.chart_key) && inPool(c, s.pool))
      else charts.filter(c => c.game_key == r.gameKey && inPool(c, s.pool) && roles(c).contains(s.action) && !picked(c.chart_key) && (!(s.banApplies || s.action == "ban") || !bans(c.chart_key)))
    }

  private[events] def applyDraftAction(r: RuleSet, charts: List[Chart], state: DraftState, actor: Actor, chartKey: String): Either[Issue, DraftState] =
    for
      step <- currentStep(r, state).toRight(Issue("draft", "选禁流程已结束"))
      _ <- Either.cond(step.actor == actor, (), Issue("actor", "尚未轮到此行动方"))
      _ <- Either.cond(eligibleCharts(r, charts, state).exists(_.chart_key == chartKey), (), Issue("chart", "该谱面不在当前合法候选中"))
      index = state.actions.count(_.stepId == step.id) + 1
    yield DraftState(state.actions :+ DraftAction(step.id, actor, step.action, chartKey, s"${step.id}:$index"))

  private[events] def buildPlayOrder(r: RuleSet, state: DraftState): List[(PlaySlot, String)] =
    r.playOrder.flatMap(s => if s.source.startsWith("fixed:") then Some(s -> s.source.drop(6)) else state.actions.find(a => a.slotId == s.source && a.action != "ban" && !state.actions.exists(d => d.action == "remove" && d.chartKey == a.chartKey)).map(a => s -> a.chartKey))

  private[events] def compare(r: RuleSet, a: List[BigDecimal], b: List[BigDecimal], extraRound: Int): Decision =
    val direction = if r.metric.higherWins then 1 else -1
    val aWins = a.zip(b).count((x,y) => x.compare(y) * direction > 0)
    val bWins = a.zip(b).count((x,y) => y.compare(x) * direction > 0)
    val aligned = a.size == b.size && a.size <= r.playOrder.size
    val complete = aligned && a.size == r.playOrder.size
    val firstTo = aligned && r.matchMode == "first-to" && (aWins >= r.winsRequired || bWins >= r.winsRequired)
    val primary = if r.matchMode == "first-to" then aWins.compare(bWins) else a.sum.compare(b.sum) * direction
    val secondary = r.tieBreak.getOrElse(Nil).map {
      case "chart-wins" => aWins.compare(bWins)
      case "best-chart" => a.maxOption.zip(b.maxOption).headOption.map((x,y) => x.compare(y)*direction).getOrElse(0)
      case "worst-chart" => a.minOption.zip(b.minOption).headOption.map((x,y) => x.compare(y)*direction).getOrElse(0)
      case _ => 0
    }.find(_ != 0).getOrElse(0)
    val comparison = if primary != 0 then primary else secondary
    val prefixWin = a.zip(b).scanLeft((r.initialWinsA.getOrElse(0),0)) { case ((aw,bw),(x,y)) =>
      val c=x.compare(y)*direction
      (aw+(if c>0 then 1 else 0),bw+(if c<0 then 1 else 0))
    }.zipWithIndex.find { case ((aw,bw),_) => aw>=r.winsRequired || bw>=r.winsRequired }
    if r.matchMode=="first-to" && aligned && prefixWin.nonEmpty then
      val ((aw,_),count)=prefixWin.get
      Decision.Winner(if aw>=r.winsRequired then "A" else "B",a.take(count).sum.toString,b.take(count).sum.toString)
    else if !complete && !firstTo then Decision.Pending("等待全部有效成绩")
    else if r.matchMode=="first-to" && !firstTo then
      if r.resolution.tie=="extra" && extraRound<r.resolution.maxExtraRounds then Decision.ExtraRound(r.resolution.scope) else Decision.Pending("无人达到目标曲胜，等待裁判处理")
    else if comparison > 0 then Decision.Winner("A", a.sum.toString, b.sum.toString)
    else if comparison < 0 then Decision.Winner("B", a.sum.toString, b.sum.toString)
    else if r.resolution.tie == "extra" && extraRound < r.resolution.maxExtraRounds then Decision.ExtraRound(r.resolution.scope)
    else Decision.Pending("同分，等待裁判处理；不自动按 ID 或提交时间判胜")

  private[events] def selectEffectiveAttempt(r: RuleSet, slotIds: List[String], attempts: List[Attempt]): Option[Standing] =
    val entryId = attempts.headOption.map(_.entryId)
    val hidden = r.pendingPolicy == "hide" && attempts.exists(_.status == "pending")
    val valid = attempts.filter(_.status == "approved").filter(a => a.items.map(_.slotId).distinct.size == a.items.size && a.items.forall(i => validateScore(i.value, r.metric).isRight))
    val complete = valid.filter(a => a.items.map(_.slotId).toSet == slotIds.toSet)
    val selected = if r.qualifierSelection == "per-chart-best" then
      slotIds.flatMap(id => valid.flatMap(a => a.items.find(_.slotId == id).map(i => (a, i))).sortBy((a,i) => decimal(i.value).getOrElse(BigDecimal(0)) * (if r.metric.higherWins then -1 else 1)).headOption)
    else
      val picked = if r.qualifierSelection == "last-approved" then complete.sortBy(-_.sequence).headOption
        else complete.sortBy(a => a.items.flatMap(i => decimal(i.value)).sum * (if r.metric.higherWins then -1 else 1)).headOption
      picked.toList.flatMap(a => a.items.map(a -> _))
    entryId.map(id => Standing(id, Option.when(!hidden && selected.size == slotIds.size)(selected.flatMap((_,i) => decimal(i.value)).sum.toString), !hidden && selected.size == slotIds.size, selected.map(_._1.id).distinct))

  private[events] def seedOrder(size: Int): List[Int] =
    if size <= 2 then List(1,2) else seedOrder(size / 2).flatMap(s => List(s, size + 1 - s))

  private[events] def bracket(entries: List[EntryId]): List[(Option[EntryId], Option[EntryId])] =
    val size = Iterator.iterate(2)(_ * 2).find(_ >= entries.size).getOrElse(256)
    seedOrder(size).map(s => entries.lift(s-1)).grouped(2).toList.map(g => (g.headOption.flatten,g.lift(1).flatten))
