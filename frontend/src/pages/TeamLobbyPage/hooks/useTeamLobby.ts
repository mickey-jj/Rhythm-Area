import { useState } from "react";
import { useTeamFormation } from "../../../features/teams/useTeamFormation";
export function useTeamLobby() {
  const data = useTeamFormation();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "seats">("name");
  const [filter, setFilter] = useState<"all" | "open" | "mine">("all");
  const [page, setPage] = useState(1);
  const mine = data.board?.teams.find(t => t.members.some(m => m.id === data.session?.user.id));
  const teams = (data.board?.teams ?? []).filter(t => (filter !== "mine" || t.id === mine?.id) && (filter !== "open" || !t.frozen && t.members.length < (data.event?.rules.team.max ?? 0)) && [t.name, ...t.members.map(m => m.displayName)].join(" ").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).toSorted((a,b) => sort === "seats" ? a.members.length - b.members.length || a.name.localeCompare(b.name,"zh-CN") : a.name.localeCompare(b.name,"zh-CN"));
  const pages = Math.max(1,Math.ceil(teams.length / 6));
  const currentPage = Math.min(page,pages);
  return { ...data, mine, search, setSearch: (s: string) => { setSearch(s); setPage(1); }, sort, setSort, filter, setFilter, teams, page: currentPage, setPage, pages, visible: teams.slice((currentPage-1)*6,currentPage*6) };
}
export type TeamLobbyState = ReturnType<typeof useTeamLobby>;
