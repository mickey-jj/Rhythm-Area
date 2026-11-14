import { useState } from "react";
import { Crown, Search, Check, X } from "lucide-react";
import { PostEventsByIdCaptainsDecisionAPI } from "../../../apis/events/PostEventsByIdCaptainsDecisionAPI";
import { Badge, Empty, Panel, SectionHeading } from "../../../components/ui";
import { ChartPagination } from "../../../components/ui/ChartPagination";
import type { TeamLobbyState } from "../hooks/useTeamLobby";
import { actionButton } from "../../../components/ui/actionStyles";
export function CandidateBoard({ page }: { page: TeamLobbyState }) {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState<"all"|"available"|"pending">("available");
  const [sort,setSort]=useState<"joined"|"name">("joined");
  const [current,setCurrent]=useState(1);
  const candidates=(page.board?.candidates ?? []).filter(c=>(filter!=="available" || !c.teamId) && (filter!=="pending" || c.captainStatus==="pending") && [c.user.displayName,c.user.username,c.note].join(" ").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const rows=sort==="name" ? candidates.toSorted((a,b)=>a.user.displayName.localeCompare(b.user.displayName,"zh-CN")) : candidates;
  const pages=Math.max(1,Math.ceil(rows.length/6));
  const currentPage=Math.min(current,pages);
  const e=page.event!;
  const mode=e.rules.team.captainSelection ?? "free";
  const managed=page.owner && e.status==="registration" && !page.board?.draft;
  return <Panel><SectionHeading title="候选选手" action={<span className="font-mono text-base text-[var(--muted)]">{rows.length} 人</span>} /><div className="mb-5 flex flex-wrap gap-3"><label className="relative min-w-44 flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input aria-label="搜索组队选手" placeholder="搜索选手、简介" className="!mt-0 !pl-10" value={search} onChange={ev=>{setSearch(ev.target.value);setCurrent(1);}} /></label><select className="!mt-0 !w-auto" aria-label="选手状态" value={filter} onChange={ev=>{setFilter(ev.target.value as typeof filter);setCurrent(1);}}><option value="available">待组队</option><option value="all">全部选手</option>{page.owner && <option value="pending">队长待审核</option>}</select><select className="!mt-0 !w-auto" aria-label="候选选手排序" value={sort} onChange={ev=>setSort(ev.target.value as typeof sort)}><option value="joined">加入顺序</option><option value="name">姓名 A–Z</option></select></div>{rows.length ? <div className="grid gap-3 md:grid-cols-2">{rows.slice((currentPage-1)*6,currentPage*6).map(c=><article key={c.user.id} className="flex flex-col rounded-xl border border-[var(--line)] p-4"><div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent)]/10 text-xl text-[var(--accent)]">{c.user.displayName.slice(0,1)}</span><h3 className="min-w-0 break-words text-lg">{c.user.displayName}</h3><span className="ml-auto">{c.captainStatus==="pending" ? <Badge status="pending">队长申请</Badge> : c.teamId ? <Badge status="accepted">已组队</Badge> : <Badge status="registration">待组队</Badge>}</span></div>{c.note && <p className="mt-3 whitespace-pre-wrap break-words text-base text-[var(--muted)]">{c.note}</p>}{managed && !c.teamId && (mode==="appointed" || mode==="application" && c.captainStatus==="pending") && <div className="mt-4 flex flex-wrap gap-2"><button className={actionButton} disabled={page.busy} onClick={()=>page.act(()=>new PostEventsByIdCaptainsDecisionAPI(e.id,{userId:c.user.id,decision:"approved"}).send(),`${c.user.displayName}已认定为队长`)}>{mode==="appointed" ? <Crown size={17} /> : <Check size={17} />}{mode==="appointed" ? "认定队长" : "通过申请"}</button>{mode==="application" && <button className={actionButton} disabled={page.busy} onClick={()=>page.act(()=>new PostEventsByIdCaptainsDecisionAPI(e.id,{userId:c.user.id,decision:"rejected"}).send(),"申请已驳回")}><X size={17} />驳回</button>}</div>}</article>)}</div> : <Empty title="暂无符合条件的选手" />}<div className="mt-4"><ChartPagination name="候选选手" unit="人" page={currentPage} pages={pages} total={rows.length} change={setCurrent} /></div></Panel>;
}
