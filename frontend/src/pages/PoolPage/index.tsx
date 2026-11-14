import { Download, SlidersHorizontal } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { PageTitle } from "../../components/ui";
import type { Event } from "../../domain/types";
import { downloadJSON } from "../../system/files/downloadJSON";
import { PoolSummary } from "./components/PoolSummary";
import { PoolListing } from "./components/PoolListing";
import { usePoolPage } from "./hooks/usePoolPage";
export function PoolPage() {
  const event = useOutletContext<Event>();
  const page = usePoolPage(event);
  const { query, session } = page;
  return <div className="space-y-6">
    <PageTitle eyebrow="CHART POOL" title="赛事图池" description={`${event.rules.gameName} · ${query.data?.length ?? event.poolCount} 张谱面`} action={<><button disabled={!query.data} onClick={() => downloadJSON(`${event.id}-pool.json`, query.data)} className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 text-[length:var(--body-size)] hover:border-[var(--accent)]"><Download size={16} />导出图池</button>{session?.user.id === event.ownerId && <Link to="/manage/config?step=4" className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-[var(--on-accent)]"><SlidersHorizontal size={16} />编辑图池</Link>}</>} />
    <PoolSummary page={page} />
    <PoolListing page={page} />
  </div>;
}
