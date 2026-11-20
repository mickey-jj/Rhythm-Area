import { Check, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Empty, ErrorBox, Loading, Panel, SectionHeading, TextLink } from "../../../components/ui";
import { stageNames } from "../../../domain/stagePresentation";
import { MatchCard } from "../../SchedulePage/components/MatchCard";
import type { Overview } from "../objects/Overview";

export function EventProgress({ page }: { page: Overview }) {
  const { event, schedule, stages } = page;
  const active = (schedule.data ?? []).filter(match => match.scheduleState!=="historical" && ["drafting", "playing", "awaiting-reveal"].includes(match.status));
  const recent = (schedule.data ?? []).filter(match => match.status === "finalized").slice(-3).reverse();
  const visible = active.length ? active.slice(0, 3) : recent;
  return <div className="space-y-6">
    <Panel><SectionHeading title={active.length ? "进行中的比赛" : "最近赛果"} action={<TextLink to="/schedule">全部赛程</TextLink>} />
      {schedule.isLoading ? <Loading /> : schedule.error ? <ErrorBox error={schedule.error} /> : visible.length ? <div className="grid gap-3 xl:grid-cols-2">{visible.map(match => <MatchCard key={match.id} match={match} kind={event.rules.stages.find(stage => stage.id === match.stageId)?.kind} />)}</div> : <Empty title="等待第一场比赛" description="赛程生成后，可在这里进入比赛室。" />}
    </Panel>
    <Panel><SectionHeading title="赛事进程" action={<TextLink to="/rules">完整规则</TextLink>} />
      {stages.error && <ErrorBox error={stages.error} />}
      <ol className="space-y-3">{event.rules.stages.map((stage, index) => {
        const run = stages.data?.find(item => item.id === stage.id);
        return <li key={stage.id}><Link to={`/schedule/${stage.id}`} className="flex items-center gap-4 rounded-xl border border-[var(--line)] p-4 transition-colors hover:bg-[var(--panel2)]"><span className={`grid size-10 shrink-0 place-items-center rounded-xl font-mono text-sm ${run?.status === "completed" ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-[var(--panel2)] text-[var(--muted)]"}`}>{run?.status === "completed" ? <Check size={18} /> : String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><h3 className="text-[length:var(--body-size)]">{stage.name}</h3><p className="mt-1 text-[length:var(--label-size)] text-[var(--muted)]">{stageNames[stage.kind]} · {index === event.rules.stages.length - 1 && stage.advance === 1 ? "决出冠军" : `前 ${stage.advance} 方晋级`}</p></div><Badge status={run?.status??"waiting"}>{stage.kind==="ranking"&&page.ranking.data?.session.status==="open"?"正在收分":run?.status==="completed"?"已完成":run?.status==="running"?"进行中":"尚未开始"}</Badge><ChevronRight size={16} className="hidden text-[var(--muted)] sm:block" /></Link></li>;
      })}</ol>
    </Panel>
  </div>;
}
