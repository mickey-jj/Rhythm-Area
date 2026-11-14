import { Link, useOutletContext } from "react-router-dom";
import { ArrowUpRight, BookOpen, Layers3 } from "lucide-react";
import { Panel, SectionHeading, StatGrid } from "../../components/ui";
import type { Event } from "../../domain/types";
import { TeamCenter } from "../../features/events/TeamCenter";
import { EventHero } from "./components/EventHero";
import { EventProgress } from "./components/EventProgress";
import { RegistrationCard } from "./components/RegistrationCard";
import { useEventOverview } from "./hooks/useEventOverview";

export function EventOverviewPage() {
  const event = useOutletContext<Event>();
  const page = useEventOverview(event);
  return <div className="space-y-6">
    <EventHero page={page} />
    <StatGrid items={[
      { label: event.rules.entryMode === "team" ? "报名队伍" : "报名人数", value: <>{event.entryCount}<span className="ml-1 text-base font-normal text-[var(--muted)]">/ {event.rules.capacity} {event.rules.entryMode === "team" ? "队" : "人"}</span></>, note: event.rules.entryMode === "solo" ? "个人参赛" : "每支队伍占 1 个名额" },
      { label: "比赛阶段", value: String(event.rules.stages.length).padStart(2, "0"), note: "按阶段有序推进" },
      { label: "赛事谱面", value: event.poolCount, note: event.rules.gameName },
      { label: "计分指标", value: event.rules.metric.name, note: event.rules.metric.higherWins ? "更高者胜" : "更低者胜" },
    ]} />
    <TeamCenter event={event} />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
      <EventProgress page={page} />
      <aside className="space-y-6"><RegistrationCard page={page} />
        {event.description && <Panel><SectionHeading title="比赛介绍" /><p className="whitespace-pre-line text-[length:var(--body-size)] leading-relaxed text-[var(--muted)]">{event.description}</p></Panel>}
        <Panel><SectionHeading title="赛事资料" /><div className="space-y-3">{[["/pool", "赛事图池", `${event.poolCount} 张谱面`, Layers3], ["/rules", "赛制与规则", `规则 v${event.ruleVersion}`, BookOpen]].map(([to, title, note, Icon]) => {
          const Glyph = Icon as typeof Layers3;
          return <Link key={String(to)} to={String(to)} className="flex items-center gap-3 rounded-lg border border-[var(--line)] p-3 hover:border-[var(--accent)]"><Glyph size={18} className="text-[var(--accent)]" /><span className="flex-1"><b className="block text-sm font-medium">{String(title)}</b><small className="text-[var(--muted)]">{String(note)}</small></span><ArrowUpRight size={16} className="text-[var(--muted)]" /></Link>;
        })}</div></Panel>
      </aside>
    </div>
  </div>;
}
