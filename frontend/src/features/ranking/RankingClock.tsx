import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Flag, Radio, Play, Square, RotateCcw } from "lucide-react";
import { useRefresh } from "../../api/client";
import { PostEventsByIdRankingControlAPI } from "../../apis/events/PostEventsByIdRankingControlAPI";
import { Badge, ErrorBox } from "../../components/ui";
import { actionButton, primaryAction } from "../../components/ui/actionStyles";
import { countdownParts, type RankingControlInput } from "../../domain/ranking";
import type { QualifierReady } from "./RankingStage";
export function RankingClock({page,compact=false}:{page:QualifierReady;compact?:boolean}) {
  const b=page.board.data;
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<unknown>(null);
  const refresh=useRefresh();
  if(!b)return null;
  const s=b.session,p=s.policy;
  const status=s.status==="open" && s.endsAt!==null && page.liveNow>=s.endsAt ? "closed" : s.status;
  const scheduled=status==="waiting" && p.startMode==="scheduled" ? Date.parse(p.startAt ?? "") : null;
  const target=scheduled ?? s.endsAt;
  const threshold=p.endMode==="threshold" && status!=="waiting";
  const elapsed=s.startedAt===null ? 0 : page.liveNow-s.startedAt;
  const time=countdownParts(status==="closed" ? 0 : target===null ? elapsed : target-page.liveNow);
  const needed=Math.max(0,(p.targetCount ?? 0)-b.qualifiedCount);
  const label=status==="closed" ? "收分已结束" : scheduled ? "距排名赛开始" : status==="waiting" ? "等待主办方开启" : threshold ? "距自动截止还差" : target!==null ? "距收分截止" : "已进行";
  const control=async(action:RankingControlInput["action"])=>{
    setBusy(true);setError(null);
    await new PostEventsByIdRankingControlAPI(page.event.id,{action,expectedVersion:s.version}).send().then(()=>refresh(),setError).finally(()=>setBusy(false));
  };
  return <section id="ranking-controls" className={compact?"relative overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[var(--panel)] p-4":"relative overflow-hidden rounded-3xl border border-[var(--accent)]/30 bg-[var(--panel)] p-5 sm:p-8"}><div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 size-96 rounded-full border-[36px] border-[var(--accent)]/5" /><div className="relative grid items-center gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.6fr)]"><div><div className="mb-5 flex flex-wrap items-center gap-3 text-base"><span className="inline-flex items-center gap-2 font-mono tracking-widest text-[var(--accent)]"><Radio size={18} />LIVE RANKING</span><Badge status={status==="open" ? "running" : status==="closed" ? "completed" : "waiting"}>{page.locked ? "正式封榜" : status==="open" ? "正在收分" : status==="closed" ? "已停止收分" : "等待开赛"}</Badge></div><p className="flex items-center gap-2 text-lg text-[var(--muted)]">{threshold ? <Flag size={20} /> : <Clock3 size={20} />}{label}</p>{threshold && status!=="closed" ? <div className="my-4 flex items-end gap-3"><strong role="timer" className="font-mono text-8xl font-semibold tabular-nums text-[var(--accent)]">{needed}</strong><span className="mb-3 text-xl text-[var(--muted)]">方达标</span></div> : status==="waiting" && !scheduled && !s.endsAt ? <p className="my-5 text-4xl font-semibold">尚未开始</p> : <div className="my-4"><span role="timer" aria-label={label} className={compact?"font-mono text-3xl font-semibold tabular-nums text-[var(--accent)]":"whitespace-nowrap font-mono text-[clamp(2.8rem,8vw,6.4rem)] font-semibold leading-tight tracking-tight tabular-nums text-[var(--accent)]"}>{time.clock}</span>{time.days>0 && <p className="mt-2 font-mono text-xl text-[var(--muted)]">另有 {time.days} 天</p>}</div>}{s.endsAt && <p className="text-base text-[var(--muted)]">截止 {new Date(s.endsAt).toLocaleString("zh-CN",{hour12:false})}</p>}{p.endMode==="threshold" && <><p className="text-base text-[var(--muted)]">已达标 <b className="font-mono text-[var(--text)]">{b.qualifiedCount} / {p.targetCount}</b> 方 · 总{page.event.rules.metric.name}{page.event.rules.metric.higherWins ? " ≥ " : " ≤ "}{p.targetScore}</p><progress className="mt-4 h-2 w-full accent-[var(--accent)]" value={Math.min(b.qualifiedCount,p.targetCount ?? 1)} max={p.targetCount ?? 1} aria-label="达标方数进度" /></>}</div><div className="space-y-4 border-t border-[var(--line)] pt-5 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0"><p className="text-base text-[var(--muted)]">{page.event.rules.stages.length>1 ? "晋级名额" : "榜单名额"}</p><p className="font-mono text-5xl font-semibold">{page.qualifier.advance}<span className="ml-2 font-sans text-lg font-normal text-[var(--muted)]">方</span></p><p className="text-base text-[var(--muted)]">{page.rows.filter(r=>r.complete).length} 方已有完整有效成绩</p>{b.canManage && status===s.status && <div className="flex flex-wrap gap-2">{status==="waiting" ? <button className={primaryAction} disabled={busy} onClick={()=>control("start")}><Play size={18} />开启排名赛</button> : status==="open" ? <button className={actionButton} disabled={busy} onClick={()=>control("close")}><Square size={17} />提前停止收分</button> : <><button className={actionButton} disabled={busy} onClick={()=>control("reopen")}><RotateCcw size={17} />重新开放</button><Link to="/manage?tab=schedule" className={primaryAction}>审核与确认晋级</Link></>}</div>}</div></div>{error!=null && <ErrorBox error={error} />}</section>;
}
