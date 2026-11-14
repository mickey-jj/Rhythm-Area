import {ResetMatch} from "../../features/judging/ResetMatch";
import {MatchCountdown} from "../../features/matches/MatchCountdown";
import { Link } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { Badge, Empty, ErrorBox, Loading, PageTitle, Panel, SectionHeading } from "../../components/ui";
import { AttemptForm } from "../../features/scoring/AttemptForm";
import { TeamQualifier } from "../../features/scoring/TeamQualifier";
import { actionButton } from "../../components/ui/actionStyles";
import { useEliminationGroup } from "./hooks/useEliminationGroup";
import { GroupStandings } from "./components/GroupStandings";
import { GroupSongs } from "./components/GroupSongs";
import { GroupReviews } from "./components/GroupReviews";
import { GroupFinalize } from "./components/GroupFinalize";
export function EliminationGroupPage() {
  const page=useEliminationGroup();
  if(page.query.isLoading)return <Loading />;
  if(page.query.error)return <ErrorBox error={page.query.error} />;
  if(!page.room || !page.group || !page.event)return null;
  const {group,room,event}=page;
  const ready={...page,group,room,event};
  const count=page.clock.data?.enabled?page.clock.data.clock.chartIndex+1:group.charts.length;
  const previous=page.records.filter(a=>a.entryId===page.mine?.id&&a.status==="approved").sort((a,b)=>b.sequence-a.sequence)[0];
  const initialValues=Object.fromEntries(previous?.items.map(i=>[i.slotId,i.value])??[]);
  const slots=group.charts.slice(0,count).map(c=>({id:c.chart_key,title:`${c.title} · ${c.difficulty_label}`}));
  const n=group.participants.length || group.expectedParticipants;
  return <div className="space-y-6"><PageTitle eyebrow="LOWER BRACKET / QUALIFICATION" title={`${n} 进 ${group.advance}`} description={`${group.stageName} · 败者组第 ${group.round} 轮`} action={<><ResetMatch event={event} id={group.id} version={group.version} enabled={group.scheduleState==="current"&&["playing","completed"].includes(group.status)} group/><Link className={actionButton} to="/schedule"><ArrowLeft size={18} />返回赛程</Link></>} /><div className="relative overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[var(--panel)] p-6 sm:p-8"><div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full border-[30px] border-[var(--accent)]/5" /><div className="relative flex flex-wrap items-center justify-between gap-5"><div><div className="mb-3 inline-flex items-center gap-2 text-base text-[var(--accent)]"><Users size={21} />同曲晋级轮</div><h2 className="font-semibold text-[length:var(--section-size)]">前 {group.advance} 方接入原败者组</h2><p className="mt-3 text-base text-[var(--muted)]">{group.scheduleState==="historical" ? "原赛程记录" : group.status==="waiting" ? "等待上游赛果确认" : `${group.charts.length} 首共同曲目 · 完整成绩排名`}</p></div><Badge status={group.status}>{group.status==="completed" ? "已确认" : group.status==="playing" ? "演奏与交分" : group.status==="cancelled" ? "已取消" : "等待对手"}</Badge></div></div><MatchCountdown groupId={group.id} match={{id:group.id,status:group.status==="completed"?"finalized":group.status==="playing"?"playing":"waiting",rules:group.rules,extraRound:0,actions:[],slots:group.charts.map((c,i)=>({id:c.chart_key,chartKey:c.chart_key,ordinal:i+1,extraRound:0}))}}/>{page.error!=null && <ErrorBox error={page.error} />}{group.status==="waiting" ? <Empty title="等待参赛方就位" description={`${n} 方使用相同曲目，前 ${group.advance} 名晋级。`} /> : <><GroupStandings page={ready} /><GroupSongs page={ready} />{page.ready && page.mine && <Panel><SectionHeading title="提交本轮成绩" />{group.rules.entryMode==="team" ? <TeamQualifier key={`${group.id}-${count}-${previous?.sequence??0}`} event={{...event,rules:group.rules}} entry={page.mine} slots={slots} groupId={group.id} previous={previous} lockedIds={page.clock.data?.enabled?slots.slice(0,-1).map(s=>s.id):[]} /> : <AttemptForm key={`${group.id}-${count}-${previous?.sequence??0}`} event={event} entry={page.mine} slots={slots} metric={group.rules.metric} groupId={group.id} initialValues={initialValues} lockedIds={page.clock.data?.enabled?slots.slice(0,-1).map(s=>s.id):[]} />}</Panel>}<GroupReviews page={ready} /><GroupFinalize page={ready} /></>}</div>;
}
