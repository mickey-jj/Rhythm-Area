import { Search, Users } from "lucide-react";
import { Empty, ErrorBox, Loading, PageTitle, StatGrid } from "../../components/ui";
import { ChartPagination } from "../../components/ui/ChartPagination";
import { captainNames, formationNames } from "../../domain/teamFormation";
import { LobbyActions } from "./components/LobbyActions";
import { CaptainManagement } from "./components/CaptainManagement";
import { CandidateBoard } from "./components/CandidateBoard";
import { TeamCard } from "./components/TeamCard";
import { useTeamLobby } from "./hooks/useTeamLobby";
export function TeamLobbyPage() {
  const page=useTeamLobby();
  if (!page.event || page.event.rules.entryMode!=="team") return <Empty title="本赛事为个人赛" />;
  if (page.query.isLoading) return <Loading />;
  if (page.query.error) return <ErrorBox error={page.query.error} />;
  if (!page.board) return null;
  const e=page.event;
  return <div className="space-y-6"><PageTitle eyebrow="TEAM ASSEMBLY / LOBBY" title="组队大厅" description={e.name} action={<span className="inline-flex items-center gap-2 text-base text-[var(--accent)]"><Users size={20} />{formationNames[e.rules.team.formation ?? "free"]}</span>} /><StatGrid items={[{label:"现有队伍",value:page.board.teams.length,note:`每队 ${e.rules.team.min}–${e.rules.team.max} 人`},{label:"候选选手",value:page.board.candidates.length},{label:"待组队",value:page.board.candidates.filter(c=>!c.teamId).length},{label:"队长认定",value:captainNames[e.rules.team.captainSelection ?? "free"]}]} />{page.error!=null && <ErrorBox error={page.error} />}{page.success && <p role="status" className="rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-4 py-3 text-base text-[var(--accent)]">{page.success}</p>}<LobbyActions page={page} /><CaptainManagement page={page} /><div className="flex flex-wrap items-center gap-3"><h2 className="mr-auto font-semibold text-[length:var(--section-size)]">全部队伍</h2><label className="relative w-full sm:w-64"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input className="!mt-0 !pl-10" aria-label="搜索队伍" placeholder="搜索队伍、成员" value={page.search} onChange={event=>page.setSearch(event.target.value)} /></label><select aria-label="队伍筛选" className="!mt-0 !w-auto" value={page.filter} onChange={ev=>page.setFilter(ev.target.value as typeof page.filter)}><option value="all">全部队伍</option><option value="open">仍有空位</option><option value="mine">我的队伍</option></select><select aria-label="队伍排序" className="!mt-0 !w-auto" value={page.sort} onChange={ev=>page.setSort(ev.target.value as typeof page.sort)}><option value="name">队名 A–Z</option><option value="seats">空位优先</option></select></div>{page.visible.length ? <div className="grid items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-3">{page.visible.map((team,index)=><TeamCard key={team.id} team={team} index={(page.page-1)*6+index} page={page} />)}</div> : <Empty title="等待队伍入场" />}<ChartPagination name="队伍" unit="队" page={page.page} pages={page.pages} total={page.teams.length} change={page.setPage} /><CandidateBoard page={page} /></div>;
}
