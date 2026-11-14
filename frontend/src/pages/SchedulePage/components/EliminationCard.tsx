import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { Badge } from "../../../components/ui";
import type { EliminationGroup } from "../../../domain/eliminationGroups";
export function EliminationCard({group}:{group:EliminationGroup}) {
  const n=group.participants.length || group.expectedParticipants;
  return <Link to={`/elimination-groups/${group.id}`} className="group block rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4 transition hover:border-[var(--accent)]"><div className="mb-4 flex items-center justify-between gap-2"><Users size={20} className="text-[var(--accent)]" /><Badge status={group.status}>{group.status==="waiting" ? "等待上游" : group.status==="playing" ? "共同演奏中" : group.status==="completed" ? "晋级已确认" : "已取消"}</Badge></div><p className="text-2xl font-bold tabular-nums">{n} <span className="mx-1 text-base font-normal text-[var(--muted)]">进</span> {group.advance}</p><p className="mt-2 text-base text-[var(--muted)]">同曲成绩排名</p><div className="mt-5 flex items-center justify-between border-t border-[var(--accent)]/20 pt-3 text-base text-[var(--accent)]"><span>进入晋级轮</span><ArrowRight size={17} className="transition group-hover:translate-x-1" /></div></Link>;
}
