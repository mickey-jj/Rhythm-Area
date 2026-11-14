import type { Chart,RuleSet } from "../../../domain/types";
import { actorNames, actionNames } from "../../../domain/types";
import { effectiveRules, stageDescription, stageNames, type Stage } from "../../../domain/stagePresentation";
import { rankingPolicy } from "../../../domain/ranking";

export function StageRules({stage,rules,charts,last,index}:{stage:Stage;rules:RuleSet;charts:Chart[];last:boolean;index:number}) {
  const r=effectiveRules(rules,stage);
  const ranking=rankingPolicy(rules,stage);
  const date=(value:string|null)=>value ? new Date(value).toLocaleString("zh-CN",{hour12:false}) : "待设置";
  const duration=ranking.durationSeconds ?? 0;
  const pool=(id:string)=>rules.stages.find(s=>s.id===id)?.name??({qualifier:"海选曲池",main:"正式曲池",extra:"加赛曲池"} as Record<string,string>)[id]??id;
  const sourceName=(source:string)=>{
    if(source.startsWith("fixed:"))return charts.find(c=>c.chart_key===source.slice(6))?.title??"固定曲（见图池）";
    const cut=source.lastIndexOf(":");const step=r.draft.find(s=>s.id===source.slice(0,cut));
    return step?`${actorNames[step.actor]}${actionNames[step.action]}的第 ${source.slice(cut+1)} 首`:"待配置曲目";
  };
  return <section className="min-w-0 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 md:p-6">
    <div className="mb-4 flex flex-wrap items-center gap-3"><span className="text-[length:var(--type-13-20)] text-[var(--accent)]">阶段 {index+1}</span><h2 className="text-[length:var(--type-20-22)] font-semibold text-[length:var(--section-size)]">{stage.name}</h2><span className="rounded border border-[var(--line)] px-2 py-1 text-[length:var(--type-13-20)]">{stageNames[stage.kind]}</span></div>
    <p className="mb-5 leading-relaxed">{stageDescription(stage,rules,last)}</p>
    {stage.kind==="ranking" ? <div className="space-y-3 text-[length:var(--type-13-20)] leading-relaxed">
      <p>计分指标“{r.metric.name}”：每首 {r.metric.minimum}–{r.metric.maximum}{r.metric.unit}，保留 {r.metric.decimals} 位小数，{r.metric.higherWins?"总值更高者在前":"总值更低者在前"}。</p>
      <p>开始：{ranking.startMode==="publish" ? "赛事发布后开放收分" : ranking.startMode==="scheduled" ? date(ranking.startAt) : "主办方手动开启"}。</p>
      <p>截止：{ranking.endMode==="fixed" ? date(ranking.deadline) : ranking.endMode==="duration" ? `开启后 ${Math.floor(duration/3600)} 小时 ${Math.floor(duration/60)%60} 分 ${duration%60} 秒` : ranking.endMode==="threshold" ? `${ranking.targetCount} 方的完整有效总成绩${r.metric.higherWins ? "达到" : "不高于"} ${ranking.targetScore}${r.metric.unit}` : "主办方手动停止收分"}。</p>
      <p>取分方式：{r.qualifierSelection==="whole-best"?"取一轮完整尝试的最佳总成绩，不把不同尝试拼成一轮。":r.qualifierSelection==="per-chart-best"?"逐首取已审核的最佳成绩，全部课题均有有效成绩后计算总值。":"取最后一轮已审核通过的完整尝试。"}</p>
      <p>新成绩待审时：{r.pendingPolicy==="retain"?"保留旧有效成绩。":"暂时隐藏旧成绩，驳回后恢复。"}收分结束后完成审核并确认名次。</p>
    </div> : <div className="space-y-6 text-[length:var(--type-13-20)]"><p className="rounded-xl bg-[var(--accent)]/5 p-4 text-[var(--accent)]">每次 BP {r.timing?.draftSeconds??60} 秒 · 每首交分 {r.timing?.chartSeconds??240} 秒 · 裁判可暂停</p>
      <div className="grid gap-4 text-[length:var(--type-13-20)] sm:grid-cols-2">
        <div><h3 className="mb-2 font-semibold">计分与胜负</h3><p>{r.metric.name} · 单曲 {r.metric.minimum}–{r.metric.maximum}{r.metric.unit} · {r.metric.decimals} 位小数 · {r.metric.higherWins?"更高者胜":"更低者胜"}</p><p className="mt-2">{r.matchMode==="total"?`双方演奏全部 ${r.playOrder.length} 首正式曲目，按总值判定胜负。`:`先达到 ${r.winsRequired} 个曲胜者获胜，达到目标后的未用曲不计入赛果。`}</p></div>
        <div><h3 className="mb-2 font-semibold">同分处理</h3>
          {!!r.tieBreak?.length&&<p>主比较相同后依次比较：{r.tieBreak.map(t=>({"chart-wins":"单曲胜场","best-chart":"最佳单曲","worst-chart":"最差单曲"} as Record<string,string>)[t]??t).join(" → ")}。</p>}
          <p>{r.resolution.tie==="extra"?`仍同分则从${pool(r.resolution.extraPool)}追加 ${r.resolution.extraCount} 首，最多 ${r.resolution.maxExtraRounds} 轮。${r.resolution.scope==="extra-only"?"只比较当前轮加赛，不累计原赛。":"累计原赛与全部加赛。"}`:"仍同分则暂停，等待裁判有依据处理，不自动判胜。"}</p>
        </div>
      </div>
      <div><h3 className="mb-3 font-semibold">选禁流程</h3>{r.draft.length?<ol className="space-y-2 text-[length:var(--type-13-20)]">{r.draft.map((step,i)=><li key={step.id} className="rounded border border-[var(--line)] p-3">{i+1}. {actorNames[step.actor]} · {actionNames[step.action]} {step.count} 首 · {pool(step.pool)}{step.action!=="ban"&&step.action!=="remove"?` · ${step.banApplies?"遵守此前禁曲":"豁免此前禁曲，仍排除已选曲"}`:""}</li>)}</ol>:<p className="text-[length:var(--type-13-20)] text-[var(--muted)]">本阶段不进行 BP，使用预设正式曲目。</p>}
        {r.draftMode==="sealed"&&<p className="mt-3 text-[length:var(--type-13-20)]">密封选曲：双方独立提交，全部完成后揭晓。</p>}
      </div>
      <div><h3 className="mb-3 font-semibold">实际演奏顺序</h3><ol className="space-y-2 text-[length:var(--type-13-20)]">{r.playOrder.map((slot,i)=><li key={slot.id}>{i+1}. {sourceName(slot.source)}</li>)}</ol></div>
    </div>}
  </section>;
}
