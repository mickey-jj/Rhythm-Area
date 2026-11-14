import { Music2 } from "lucide-react";
import { poolTags } from "../../../domain/configuration";
import type { PoolPageState } from "../objects/PoolPage";
export function PoolSummary({ page }: { page: PoolPageState }) {
  const { event, query, tags, poolName, pool, setPool, setPage } = page;
  return (
    <div className="grid gap-4 sm:grid-cols-3">{[{ value: "all", label: "全部谱面", count: query.data?.length ?? event.poolCount }, ...tags.slice(0, 2).map(tag => ({ value: tag, label: `${poolName(tag)}图池`, count: query.data?.filter(chart => poolTags(chart).includes(tag)).length ?? 0 }))].map(item => <button key={item.value} onClick={() => { setPool(item.value); setPage(1); }} aria-pressed={pool === item.value} className={`flex items-center gap-4 rounded-xl border bg-[var(--panel)] p-5 text-left transition-colors ${pool === item.value ? "border-[var(--accent)]/50" : "border-[var(--line)] hover:border-[var(--accent)]/30"}`}><span className="grid size-11 place-items-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]"><Music2 size={21} /></span><span><span className="block text-[length:var(--label-size)] text-[var(--muted)]">{item.label}</span><b className="mt-1 block text-2xl tabular-nums">{item.count}</b></span></button>)}</div>
  );
}
