import { ArrowUpRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui";
import type { Match, StageKind } from "../../../domain/types";
import { roundLabel } from "../../../domain/stagePresentation";
export function MatchCard({ match, kind }: { match: Match; kind?: StageKind }) {
  return <Link to={`/matches/${match.id}`} className="group block min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-sm transition-colors hover:border-[var(--accent)]/60">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3"><span className="text-[length:var(--label-size)] text-[var(--muted)]">{roundLabel(match.bracket, match.round, kind)} · {String(match.ordinal + 1).padStart(2, "0")}</span><Badge status={match.status} /></div>
    <div className="space-y-2 p-3">{[match.a, match.b].map((entry, index) => <div key={index} className={`flex items-center gap-3 rounded-lg px-2 py-4 ${entry && match.winnerId === entry.id ? "bg-[var(--accent)]/10" : ""}`}><span className="grid size-7 shrink-0 place-items-center rounded-lg border border-[var(--accent)]/15 bg-[var(--accent)]/5 font-mono text-xs text-[var(--muted)]">{entry?.seed ?? "—"}</span><span className="min-w-0 flex-1 break-words text-[length:var(--body-size)] font-medium">{entry?.displayName ?? (["empty", "bye"].includes(match.status) ? "轮空" : "等待上游结果")}</span>{entry && match.winnerId === entry.id && <Trophy size={16} aria-label="胜者" className="shrink-0 text-[var(--accent)]" />}</div>)}</div>
    <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2.5 text-[length:var(--label-size)] text-[var(--muted)] group-hover:text-[var(--accent)]"><span>进入比赛室</span><ArrowUpRight size={15} /></div>
  </Link>;
}
