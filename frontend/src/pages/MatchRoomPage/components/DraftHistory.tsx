import { RoomChartCard } from "./RoomChartCard";
import { actorNames,actionNames } from "../../../domain/types";
import type { MatchReady } from "../objects/MatchState";
export function DraftHistory({page}:{page:MatchReady}){
 const {m,pool,title}=page;
 const steps=m.rules.draft.flatMap(step=>Array.from({length:step.count},(_,index)=>({step,index,action:m.actions.filter(a=>a.stepId===step.id)[index]})));
 return <section aria-label="BP 记录" className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-6"><header className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2>BP 记录</h2><span className="font-mono text-sm text-[var(--muted)]">{m.actions.length} / {steps.length}</span></header>{steps.length?<div className="overflow-x-auto pb-2"><ol aria-label="图形选禁记录" className="grid min-w-[640px] grid-cols-5 gap-3">{steps.map(({step,index,action},i)=>{const chart=action?pool.data?.find(c=>c.chart_key===action.chartKey):undefined;return <RoomChartCard key={`${step.id}-${index}`} chart={chart} title={action?(chart?title(action.chartKey):"等待揭晓"):"等待选禁"} tag={`${String(i+1).padStart(2,"0")} · ${step.action.toUpperCase()}`} subtitle={`${actorNames[step.actor]} · ${actionNames[step.action]}`} banned={!!action&&step.action==="ban"} active={!action&&m.currentStep?.id===step.id}/>;})}</ol></div>:<p className="text-base text-[var(--muted)]">本场无需 BP</p>}</section>;
}
