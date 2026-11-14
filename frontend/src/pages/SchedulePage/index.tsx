import {StageDirectory} from "./components/StageDirectory";
import {ArrowLeft,ArrowUpRight,Layers3,Radio,Trophy} from "lucide-react";
import {Link,useOutletContext,useParams} from "react-router-dom";
import {useState} from "react";
import {useApi} from "../../api/client";
import {GetEventsByIdScheduleAPI} from "../../apis/events/GetEventsByIdScheduleAPI";
import {GetEventsByIdStagesAPI} from "../../apis/events/GetEventsByIdStagesAPI";
import {GetEventsByIdEntriesAPI} from "../../apis/events/GetEventsByIdEntriesAPI";
import {GetEventsByIdEliminationGroupsAPI} from "../../apis/events/GetEventsByIdEliminationGroupsAPI";
import {Badge,Empty,ErrorBox,Loading,PageTitle} from "../../components/ui";
import {stageNames} from "../../domain/stagePresentation";
import type {Event} from "../../domain/types";
import {useCurrentSession} from "../../state/session";
import {QualifierPage} from "../QualifierPage";
import {MatchCountdown} from "../../features/matches/MatchCountdown";
import {MatchBoard} from "./components/MatchBoard";
import {MatchCard} from "./components/MatchCard";
import {Qualification} from "./components/Qualification";
export function SchedulePage(){
 const event=useOutletContext<Event>(),{stageId}=useParams(),session=useCurrentSession();
 const matches=useApi(new GetEventsByIdScheduleAPI(event.id),true,3000),runs=useApi(new GetEventsByIdStagesAPI(event.id),true,3000),entries=useApi(new GetEventsByIdEntriesAPI(event.id),true,3000),groups=useApi(new GetEventsByIdEliminationGroupsAPI(event.id),true,3000);
 const [view,setView]=useState<"rounds"|"list">("rounds");
 if(matches.isLoading||runs.isLoading||groups.isLoading)return <Loading/>;
 if(matches.error||runs.error||groups.error)return <ErrorBox error={matches.error??runs.error??groups.error}/>;
 const current=(matches.data??[]).filter(m=>m.scheduleState!=="historical"&&!['empty','cancelled'].includes(m.status)),history=(matches.data??[]).filter(m=>m.scheduleState==="historical"&&m.status==="finalized");
 const stage=event.rules.stages.find(s=>s.id===stageId),run=runs.data?.find(s=>s.id===stageId),index=event.rules.stages.findIndex(s=>s.id===stageId),next=runs.data?.find(s=>s.id===event.rules.stages[index+1]?.id);
 const active=current.find(m=>m.status==="playing")??current.find(m=>m.status==="drafting"&&m.a&&m.b),rows=current.filter(m=>m.stageId===stageId);
 const stageActive=rows.find(m=>m.status==="playing")??rows.find(m=>m.status==="drafting"&&m.a&&m.b);
 if(stageId==="history")return <div className="space-y-6"><Link to="/schedule" className="text-sm text-[var(--accent)]">← 全部赛程</Link><PageTitle eyebrow="ARCHIVE / RESULTS" title="历史赛果" description={event.name}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{history.map(m=><MatchCard key={m.id} match={m} kind={m.stageKind}/>)}</div></div>;
 if(stageId&&!stage)return <Empty title="阶段不存在"><Link to="/schedule">返回赛程</Link></Empty>;
 if(stage?.kind==="ranking")return <div className="space-y-5"><Link to="/schedule" className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><ArrowLeft size={17}/>全部赛程</Link><QualifierPage/></div>;
 return <div className="space-y-6">{stage&&<Link to="/schedule" className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><ArrowLeft size={17}/>全部赛程</Link>}<PageTitle eyebrow={stage?"STAGE / LIVE BRACKET":"TOURNAMENT / LIVE AREA"} title={stage?.name??"赛事看板"} description={event.name}/>
 <section className="relative overflow-hidden rounded-3xl border border-[var(--accent)]/25 bg-[var(--panel)] p-6 sm:p-8"><div aria-hidden className="pointer-events-none absolute -right-20 -top-32 size-96 rounded-full border-[40px] border-[var(--accent)]/5"/><div className="relative flex flex-wrap items-start justify-between gap-5"><div><p className="mb-4 flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-[var(--accent)]"><Radio size={17}/>{stage?stageNames[stage.kind]:"LIVE TOURNAMENT"}</p><h2 className="font-semibold text-[length:var(--section-size)]">{stage ? run?.status==="completed"?"本阶段已完成":"本阶段进行中" : event.status==="completed"?"冠军已诞生":"赛程实时更新"}</h2></div><Badge status={stage ? run?.status??"pending" : event.status}/></div><div className="relative mt-8 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-6">{[{label:"参赛方",value:stage?run?.participants.length??0:entries.data?.length??0},{label:"已结束对局",value:stage?rows.filter(m=>['finalized','bye'].includes(m.status)).length:current.filter(m=>['finalized','bye'].includes(m.status)).length+history.length},{label:stage?"晋级名额":"比赛阶段",value:stage?stage.advance:event.rules.stages.length}].map(v=><div key={v.label}><p className="mb-2 text-sm text-[var(--muted)]">{v.label}</p><p className="font-mono text-4xl font-semibold text-[var(--accent)]">{String(v.value).padStart(2,"0")}</p></div>)}</div></section>
 {!stage ? <>{active&&<section className="grid gap-5 xl:grid-cols-2"><MatchCountdown match={active} controls={false}/><MatchCard match={active} kind={active.stageKind}/></section>}<StageDirectory event={event} matches={current} runs={runs.data??[]}/>{!!history.length&&<Link to="/schedule/history" className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-6 py-5 text-base"><span>历史赛果 · {history.length} 场</span><ArrowUpRight size={19} className="text-[var(--accent)]"/></Link>}</> : <>
 {stageActive&&<MatchCountdown match={stageActive} controls={false}/>}
 {!!run?.placements.length&&<section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6"><h2 className="mb-5 flex items-center gap-2 text-[length:var(--section-size)]"><Trophy size={21} className="text-[var(--accent)]"/>阶段排名</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{run.placements.map(p=><article key={p.entryId} className="flex items-center gap-4 rounded-2xl border border-[var(--line)] p-4"><span className="font-mono text-3xl font-semibold text-[var(--accent)]">{String(p.rank).padStart(2,"0")}</span><div><h3 className="font-semibold">{entries.data?.find(e=>e.id===p.entryId)?.displayName??"参赛方"}</h3><p className="mt-1 text-sm text-[var(--muted)]">{p.wins} 胜 · {p.losses} 负 · {next?next.participants.includes(p.entryId)?"已晋级":"阶段结束":p.rank===1&&index===event.rules.stages.length-1?"冠军":"阶段结束"}</p></div></article>)}</div></section>}
 <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6"><header className="mb-6 flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-2 text-[length:var(--section-size)]"><Layers3 size={21} className="text-[var(--accent)]"/>对阵与晋级</h2><div className="flex gap-1 rounded-xl bg-[var(--bg)] p-1">{(['rounds','list'] as const).map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)} className="rounded-lg px-4 py-2 text-sm aria-pressed:bg-[var(--accent)]/10 aria-pressed:text-[var(--accent)]">{v==='rounds'?'对阵视图':'比赛列表'}</button>)}</div></header><MatchBoard matches={rows.length?rows:run?.status==="completed"?history.filter(m=>m.stageId===stage.id):rows} view={view} kind={stage.kind} groups={groups.data?.filter(g=>g.stageId===stage.id&&g.scheduleState==="current")}/></section>{run?.status==="qualification-tie"&&session?.user.id===event.ownerId&&<Qualification event={event} run={run} entries={entries.data??[]}/>}</>}
 </div>;
}
