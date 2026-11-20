import { useApi } from "../../api/client";
import { GetEventsByIdPoolAPI } from "../../apis/events/GetEventsByIdPoolAPI";
import { GetMatchesByIdAPI } from "../../apis/events/GetMatchesByIdAPI";
import { EvidenceReadAPI } from "../../apis/events/EvidenceReadAPI";
import type { Attempt } from "../../domain/types";

export function AttemptScores({attempt,showEvidence=false}:{attempt:Attempt;showEvidence?:boolean}){
 const pool=useApi(new GetEventsByIdPoolAPI(attempt.eventId,attempt.matchId?{matchId:attempt.matchId}:{}));
 const detail=useApi(new GetMatchesByIdAPI(attempt.matchId??undefined),!!attempt.matchId);
 const match=detail.data;
 return <div className="my-3 space-y-2"><ol className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] px-3">{attempt.items.map((item,index)=>{
  const key=match?.slots.find(s=>s.id===item.slotId)?.chartKey??item.slotId;
  const chart=pool.data?.find(c=>c.chart_key===key);
  return <li key={item.slotId} className="flex flex-wrap justify-between gap-3 py-2 text-base"><span>{index+1}. {chart?`${chart.title} · ${chart.difficulty_label}`:pool.isLoading?"曲目加载中…":`曲目 ${item.slotId}`}</span><strong className="font-mono tabular-nums">{item.value}</strong></li>;
 })}</ol><p className="text-sm text-[var(--muted)]">{attempt.matchId?"正赛":attempt.groupId?"多人晋级轮":"排名赛"} · 总分 <b className="font-mono">{attempt.items.reduce((sum,item)=>sum+Number(item.value),0).toLocaleString("zh-CN",{maximumFractionDigits:12})}</b></p>{attempt.submittedAt!=null&&<time className="block text-sm text-[var(--muted)]" dateTime={new Date(attempt.submittedAt).toISOString()}>提交于 {new Date(attempt.submittedAt).toLocaleString("zh-CN")}</time>}{showEvidence&&<><p className="whitespace-pre-wrap break-words text-sm text-[var(--muted)]">{attempt.evidenceNote}</p>{attempt.evidenceId&&<a className="inline-block text-sm text-[var(--accent)] underline" href={new EvidenceReadAPI(attempt.evidenceId).url} target="_blank" rel="noreferrer">查看私有证据附件</a>}</>}</div>;
}
