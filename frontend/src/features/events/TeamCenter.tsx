import { Link } from "react-router-dom";
import { ArrowUpRight, Users } from "lucide-react";
import { useApi } from "../../api/client";
import { GetEventsByIdTeamsAPI } from "../../apis/events/GetEventsByIdTeamsAPI";
import { Panel, SectionHeading } from "../../components/ui";
import type { Event } from "../../domain/types";
import type { Team } from "../../domain/teamFormation";
import { formationNames } from "../../domain/teamFormation";
import { useCurrentSession } from "../../state/session";
export type { Team } from "../../domain/teamFormation";
export function TeamCenter({event}:{event:Event}) {
  const session=useCurrentSession();
  const query=useApi<Team[]>(new GetEventsByIdTeamsAPI(event.id),event.rules.entryMode==="team");
  if(event.rules.entryMode!=="team") return null;
  const mine=query.data?.find(t=>t.members.some(m=>m.id===session?.user.id));
  return <Panel><SectionHeading title={mine?.name ?? "组队大厅"} action={<Users size={22} className="text-[var(--accent)]" />} /><div className="flex flex-wrap items-center justify-between gap-4"><p className="text-base text-[var(--muted)]">{mine ? mine.members.map(m=>m.displayName+(m.id===mine.captainId ? " · 队长" : "")).join(" / ") : `${formationNames[event.rules.team.formation ?? "free"]} · 每队 ${event.rules.team.min}–${event.rules.team.max} 人`}</p><Link to="/teams" className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-3 text-base font-medium text-[var(--accent)]">{mine ? "查看队伍" : "进入大厅"}<ArrowUpRight size={18} /></Link></div></Panel>;
}
