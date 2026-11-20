import { Music2 } from "lucide-react";
import { Empty, ErrorBox, Loading, Panel, SectionHeading } from "../../../components/ui";
import { ChartArtwork } from "../../../components/ui/ChartArtwork";
import type { QualifierReady } from "../../../features/ranking/RankingStage";

export function QualifierTasks({page}:{page:QualifierReady}) {
  const {charts,songs}=page;
  return <Panel><SectionHeading title="规定课题" action={<Music2 size={20} className="text-[var(--accent)]"/>}/>{charts.isLoading?<Loading/>:charts.error?<ErrorBox error={charts.error}/>:!songs.length?<Empty title="尚未设置课题"/>:<ol className="grid gap-4 md:grid-cols-3">{songs.map((chart,index)=><li key={chart.chart_key} className="relative min-w-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel2)] p-5"><div className="mb-5 flex items-start justify-between gap-3"><ChartArtwork chart={chart} size="medium"/><span className="font-mono text-base text-[var(--accent)]">{String(index+1).padStart(2,"0")}</span></div><h3 className="break-words text-lg font-medium">{chart.title}</h3><p className="mt-2 break-words text-base text-[var(--muted)]">{chart.artist || "—"}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="rounded-lg border border-[var(--accent)]/25 px-3 py-1.5 font-mono text-sm text-[var(--accent)]">{chart.difficulty_label}</span><span className="font-mono text-xl text-[var(--accent)]">{chart.level_value ?? "—"}</span></div></li>)}</ol>}</Panel>;
}
