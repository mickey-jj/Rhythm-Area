import { Panel, SectionHeading } from "../../../components/ui";
import { ChartArtwork } from "../../../components/ui/ChartArtwork";
import type { EliminationPageState } from "../objects/EliminationPageState";
export function GroupSongs({page}:{page:EliminationPageState}) {
  return <Panel><SectionHeading title="共同演奏曲目" action={<span className="text-base text-[var(--muted)]">相同曲目 · 完整总分</span>} /><ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{page.group.charts.map((chart,i)=><li key={chart.chart_key} className="flex items-center gap-4 rounded-xl border border-[var(--line)] p-4"><ChartArtwork chart={chart} size="medium" /><div className="min-w-0"><span className="font-mono text-sm text-[var(--accent)]">{String(i+1).padStart(2,"0")}</span><h3 className="mt-1 break-words text-lg font-semibold">{chart.title}</h3><p className="mt-2 text-base text-[var(--muted)]">{chart.difficulty_label} {chart.level_value}</p></div></li>)}</ol></Panel>;
}
