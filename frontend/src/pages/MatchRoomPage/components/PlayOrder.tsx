import { RoomChartCard } from "./RoomChartCard";
import type { MatchReady } from "../objects/MatchState";
export function PlayOrder({page}:{page:MatchReady}){
 const {m,pool,title}=page,clock=page.clock.data?.clock;
 const planned=m.slots.length?m.slots:m.rules.playOrder.map((s,i)=>({id:s.id,chartKey:"",ordinal:i+1,extraRound:0}));
 return <section aria-label="演奏曲目" className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-6"><header className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2>演奏曲目</h2><span className="font-mono text-sm text-[var(--muted)]">{planned.length} TRACKS</span></header><div className="overflow-x-auto pb-2"><ol aria-label="演奏曲绘" className="grid min-w-[640px] grid-cols-5 gap-3">{planned.map((slot,i)=>{const c=pool.data?.find(c=>c.chart_key===slot.chartKey),current=m.slots.filter(s=>s.extraRound===m.extraRound)[clock?.chartIndex??0];const active=m.status==="playing"&&clock?.status!=="finished"&&current?.id===slot.id;return <RoomChartCard key={slot.id} chart={c} title={slot.chartKey?title(slot.chartKey):"等待选禁完成"} tag={active?"当前曲目":`TRACK ${String(i+1).padStart(2,"0")}`} active={active} subtitle={c?`${c.difficulty_label} ${c.level_value??""}${slot.extraRound?` · 加赛 ${slot.extraRound}`:""}`:"待确定"}/>;})}</ol></div></section>;
}
