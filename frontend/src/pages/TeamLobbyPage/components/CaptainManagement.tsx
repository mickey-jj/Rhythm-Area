import { Link } from "react-router-dom";
import { Crown, Shuffle, ArrowUpRight } from "lucide-react";
import { PostEventsByIdCaptainsDrawAPI } from "../../../apis/events/PostEventsByIdCaptainsDrawAPI";
import { PostEventsByIdTeamsRandomAPI } from "../../../apis/events/PostEventsByIdTeamsRandomAPI";
import { Panel, SectionHeading } from "../../../components/ui";
import type { TeamLobbyState } from "../hooks/useTeamLobby";
import { actionButton, primaryAction } from "../../../components/ui/actionStyles";
export function CaptainManagement({ page }: { page: TeamLobbyState }) {
  const e=page.event!;
  const board=page.board!;
  const mode=e.rules.team.formation ?? "free";
  const count=e.rules.team.captainCount ?? Math.min(2,e.rules.capacity);
  return <Panel><SectionHeading title="队长席位" action={<span className="font-mono text-lg text-[var(--accent)]">{board.teams.length} / {(e.rules.team.captainSelection ?? "free")==="free" && mode==="free" ? e.rules.capacity : count}</span>} /><div className="flex flex-wrap gap-3">{board.teams.map(t=><div key={t.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel2)] px-4 py-3"><Crown size={18} className="text-amber-400" /><span className="text-base">{t.members.find(m=>m.id===t.captainId)?.displayName}</span></div>)}{!board.teams.length && <span className="py-3 text-base text-[var(--muted)]">等待队长入席</span>}</div><div className="mt-5 flex flex-wrap gap-3">{page.owner && e.status==="registration" && !board.draft && (e.rules.team.captainSelection ?? "free")==="random" && <button className={primaryAction} disabled={page.busy || board.teams.length>0 || board.candidates.length<count} onClick={()=>page.act(()=>new PostEventsByIdCaptainsDrawAPI(e.id).send(),"队长抽签完成")}><Shuffle size={18} />随机抽取队长</button>}{page.owner && e.status==="registration" && !board.draft && mode==="random" && <button className={primaryAction} disabled={page.busy || board.teams.length!==count} onClick={()=>page.act(()=>new PostEventsByIdTeamsRandomAPI(e.id).send(),"随机组队完成")}><Shuffle size={18} />随机均衡组队</button>}{mode==="draft" && <Link to="/team-draft" className={actionButton}>进入队长选人台<ArrowUpRight size={18} /></Link>}</div></Panel>;
}
