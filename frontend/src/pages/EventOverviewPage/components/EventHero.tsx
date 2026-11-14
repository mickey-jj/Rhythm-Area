import { ArrowRight, AudioLines, GitBranch, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui";
import type { Overview } from "../objects/Overview";

export function EventHero({ page }: { page: Overview }) {
  const { event, stages } = page;
  const active = stages.data?.find(stage => stage.status === "running" || stage.status === "qualification-tie");
  const last = stages.data?.find(stage => stage.id === event.rules.stages.at(-1)?.id);
  const champion = last?.status === "completed" && event.rules.stages.at(-1)?.advance === 1
    ? page.entries.data?.find(entry => entry.id === last.placements.find(place => place.rank === 1)?.entryId) : undefined;
  return <section className="relative isolate overflow-hidden rounded-2xl border border-[var(--line)] border-t-2 border-t-[var(--brand-color)] bg-[var(--panel)]">
    <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-[440px] rounded-full border-[55px] border-[var(--accent)]/5" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-16 size-80 rotate-45 rounded-[64px] border border-[var(--accent)]/15" />
    <div className="relative grid gap-8 px-6 py-8 sm:px-9 sm:py-10 xl:grid-cols-[1.7fr_1fr]">
      <div className="min-w-0"><div className="mb-5 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 font-mono text-[length:var(--label-size)] tracking-[0.16em] text-[var(--accent)]"><AudioLines size={15} />RHYTHM AREA / TOURNAMENT</span><Badge status={event.status} /></div>
        <h1 className="max-w-3xl break-words text-balance font-bold leading-[1.35] tracking-tight text-[length:var(--heading-size)]">{event.name}</h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[length:var(--body-size)] text-[var(--muted)]"><span>{event.rules.gameName}</span><span className="h-3 w-px bg-[var(--line)]" /><span>{event.rules.entryMode === "solo" ? "个人赛" : "团体赛"}</span><span className="h-3 w-px bg-[var(--line)]" /><span>{event.rules.clientVersion}</span></p>
        <div className="mt-7 flex flex-wrap gap-3"><Link to="/schedule" className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 text-[length:var(--body-size)] font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-85"><GitBranch size={17} />查看赛程<ArrowRight size={16} /></Link><Link to="/rules" className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-3 text-[length:var(--body-size)] hover:border-[var(--accent)]">赛事规则</Link></div>
      </div>
      <div className="flex flex-col justify-end border-t border-[var(--line)] pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0"><p className="mb-3 font-mono text-[length:var(--label-size)] tracking-widest text-[var(--muted)]">{champion ? "TOURNAMENT WINNER" : "CURRENT STAGE"}</p><div className="flex items-center gap-3"><Trophy size={28} className="shrink-0 text-[var(--accent)]" /><p className="break-words text-2xl font-semibold text-[var(--accent)]">{champion?.displayName ?? active?.name ?? (event.status === "completed" ? "比赛已结束" : event.status === "registration" ? "开放报名" : "等待赛程")}</p></div><p className="mt-3 text-[length:var(--label-size)] text-[var(--muted)]">{champion ? "最终赛果已确认" : active ? "查看对阵，进入比赛室" : "以已发布的规则与赛程为准"}</p></div>
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--accent)]/5 px-6 py-3 text-[length:var(--label-size)] sm:px-9"><span className="text-[var(--muted)]">{event.rules.stages.map(stage => stage.name).join("  /  ")}</span><span className="shrink-0 font-mono text-[var(--accent)]">RULES v{event.ruleVersion}</span></div>
  </section>;
}
