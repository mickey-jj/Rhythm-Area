import { Dialog } from "../../../components/ui/Dialog";
import { ChartArtwork } from "../../../components/ui/ChartArtwork";
import { primaryAction } from "../../../components/ui/actionStyles";
import type { PoolSelectionState } from "../objects/PoolSelectionState";
export function PoolArtworkPreview({page}:{page:PoolSelectionState}) {
  const c=page.preview;
  if(!c)return null;
  const included=page.byKey.get(c.chart_key)?.pools.includes(page.target);
  return <Dialog title={c.title} close={()=>page.setPreviewKey(null)} actions={<button type="button" className={primaryAction} onClick={()=>{if(included)page.remove([c.chart_key]);else page.assign([c.chart_key]);page.setPreviewKey(null);}}>{included ? "从当前图池移出" : "加入当前图池"}</button>}><div className="flex flex-col items-center gap-5 text-center"><ChartArtwork chart={c} size="preview" /><p className="text-lg text-[var(--muted)]">{c.artist}</p><p className="font-mono text-2xl text-[var(--accent)]">{c.difficulty_label} · {c.level_value ?? "—"}</p></div></Dialog>;
}
