import { PoolProperties } from "./components/PoolProperties";
import { PoolArtworkPreview } from "./components/PoolArtworkPreview";
import { Link } from "react-router-dom";
import { Empty, ErrorBox, Loading } from "../../components/ui";
import { Dialog } from "../../components/ui/Dialog";
import { PoolBrowser } from "./components/PoolBrowser";
import { PoolHeader } from "./components/PoolHeader";
import { PoolTargets } from "./components/PoolTargets";
import { usePoolSelection } from "./hooks/usePoolSelection";

export function PoolSelectionPage() {
  const page=usePoolSelection();
  if(!page.instance.isOwner) return <Empty title="请登录主办账号"><Link to="/auth?returnTo=/manage/pools">登录</Link></Empty>;
  if(!page.instance.hasEvent) return <Empty title="请先保存赛事草稿"><Link to="/manage/config">赛事配置</Link></Empty>;
  if(page.event.error || page.pool.error || page.library.error) return <ErrorBox error={page.event.error ?? page.pool.error ?? page.library.error} />;
  if(!page.draft || !page.library.data) return <Loading />;
  return <div className="space-y-5"><PoolHeader page={page} />{page.error!=null && <ErrorBox error={page.error} />}<fieldset disabled={page.busy} className="grid min-w-0 items-start gap-5 xl:grid-cols-[256px_minmax(0,1fr)]"><PoolTargets page={page} /><PoolBrowser page={page} /></fieldset>{page.properties && <PoolProperties page={page} />}{page.preview && <PoolArtworkPreview page={page} />}{page.destination && <Dialog title="分池尚未保存" close={page.closeNavigation} actions={<><button disabled={page.busy} onClick={page.closeNavigation} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm">继续编辑</button><button disabled={page.busy} onClick={()=>void page.leave(false)} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm">放弃更改</button><button disabled={page.busy} onClick={()=>void page.leave(true)} className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm text-[var(--on-accent)]">保存并继续</button></>}><p className="font-mono text-3xl">{page.assignments.length}<span className="ml-3 font-sans text-sm text-[var(--muted)]">张谱面</span></p>{page.error!=null && <ErrorBox error={page.error} />}</Dialog>}</div>;
}
