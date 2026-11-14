import {GetEliminationGroupsByIdClockAPI} from "../../apis/events/GetEliminationGroupsByIdClockAPI";
import {PostEliminationGroupsByIdClockAPI} from "../../apis/events/PostEliminationGroupsByIdClockAPI";
import {GetMatchesByIdAPI} from "../../apis/events/GetMatchesByIdAPI";
import {useEffect,useState} from "react";
import {Clock3,Pause,Play,RotateCcw,SkipForward} from "lucide-react";
import {useApi,useRefresh} from "../../api/client";
import {GetMatchesByIdClockAPI} from "../../apis/events/GetMatchesByIdClockAPI";
import {PostMatchesByIdClockAPI} from "../../apis/events/PostMatchesByIdClockAPI";
import {countdownParts} from "../../domain/ranking";
import type {ClockAction} from "../../domain/matchClock";
import type {Match} from "../../domain/types";
import {ErrorBox} from "../../components/ui";
export function MatchCountdown({match:input,controls=true,groupId}:{match:Pick<Match,"id"|"status"|"rules"|"actions"|"slots"|"extraRound">;controls?:boolean;groupId?:string}){
 const detail=useApi(new GetMatchesByIdAPI(input.id),!groupId,2000);
 const q=useApi(groupId?new GetEliminationGroupsByIdClockAPI(groupId):new GetMatchesByIdClockAPI(input.id),true,2000),refresh=useRefresh();
 const [now,setNow]=useState(Date.now),[busy,setBusy]=useState(false),[error,setError]=useState<unknown>(null);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
 const match=groupId?input:detail.data;
 if(!match)return detail.error?<ErrorBox error={detail.error}/>:null;
 const b=q.data,s=b?.clock;if(!b||!s)return q.error?<ErrorBox error={q.error}/>:null;
 const live=now+b.serverNow-q.dataUpdatedAt;
 const remaining=s.status==="running" ? Math.min(s.remainingMs,Math.max(0,(s.endsAt??live)-live)) : s.remainingMs;
 const expired=s.status==="expired" || s.status==="running"&&remaining===0;
 const label=s.status==="finished" ? match.status==="playing" ? "成绩已齐 · 待确认赛果" : "比赛已结束" : expired ? "时间到 · 待裁判处理" : s.status==="paused" ? "裁判已暂停" : s.status==="ready" ? match.status==="awaiting-reveal" ? "等待裁判揭晓" : match.status==="waiting" ? "等待参赛方就位" : "等待开赛" : match.status==="drafting" ? "选禁进行中" : "演奏与交分";
 const action=async(a:ClockAction)=>{setBusy(true);setError(null);await (groupId?new PostEliminationGroupsByIdClockAPI(groupId,{action:a,expectedVersion:s.version}):new PostMatchesByIdClockAPI(match.id,{action:a,expectedVersion:s.version})).send().then(()=>refresh(),setError).finally(()=>setBusy(false));};
 const button="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/25 px-4 py-2 text-sm font-medium disabled:opacity-40";
 return <section aria-label="比赛倒计时" className="relative overflow-hidden rounded-3xl border border-[var(--accent)]/25 bg-[var(--panel)] p-5 sm:p-7"><div aria-hidden className="pointer-events-none absolute -right-12 -top-20 size-72 rounded-full border-[28px] border-[var(--accent)]/5"/><div className="relative flex flex-wrap items-center justify-between gap-6"><div><p className="mb-3 flex items-center gap-2 text-sm tracking-widest text-[var(--accent)]"><Clock3 size={17}/>{label}</p><div role="timer" className={`font-mono text-6xl font-semibold tracking-tight tabular-nums sm:text-7xl ${expired ? "text-[var(--danger)]" : "text-[var(--accent)]"}`}>{s.status==="finished" ? "FINISHED" : countdownParts(remaining).clock}</div></div><div className="space-y-3"><p className="text-base text-[var(--muted)]">{s.status==="finished" ? "计时结束" : match.status==="drafting" ? `${match.actions.length+1} / ${match.rules.draft.reduce((n,d)=>n+d.count,0)} · BP` : `第 ${s.chartIndex+1} / ${match.slots.filter(v=>v.extraRound===match.extraRound).length} 首`}</p>{b.canManage&&controls&&["drafting","playing"].includes(match.status)&&s.status!=="finished"&&<div className="flex flex-wrap gap-2">{s.status==="ready"?<button disabled={busy} className={button+" bg-[var(--accent)] text-[var(--on-accent)]"} onClick={()=>action("start")}><Play size={17}/>{match.status==="drafting" ? "开赛 · 开始 BP" : "开始本曲"}</button>:s.status==="running"&&!expired?<button disabled={busy} className={button} onClick={()=>action("pause")}><Pause size={17}/>暂停</button>:s.status==="paused"?<button disabled={busy} className={button} onClick={()=>action("resume")}><Play size={17}/>恢复计时</button>:null}{(s.status==="expired"||s.status==="paused")&&<button disabled={busy} className={button} onClick={()=>action("restart")}><RotateCcw size={17}/>重新计时</button>}{match.status==="playing"&&s.chartIndex+1<match.slots.filter(v=>v.extraRound===match.extraRound).length&&s.status!=="ready"&&<button disabled={busy} className={button} onClick={()=>action("next")}><SkipForward size={17}/>下一曲</button>}</div>}</div></div>{error!=null&&<div className="mt-4"><ErrorBox error={error}/></div>}</section>;
}
