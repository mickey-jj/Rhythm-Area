import { Search, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useApi } from "../../api/client";
import { GetEventsByIdEntriesAPI } from "../../apis/events/GetEventsByIdEntriesAPI";
import { Badge, Empty, ErrorBox, Loading, PageTitle, StatGrid } from "../../components/ui";
import type { Entry, EntryStatus, Event } from "../../domain/types";

export function ParticipantsPage() {
  const event = useOutletContext<Event>();
  const query = useApi<Entry[]>(new GetEventsByIdEntriesAPI(event.id));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | EntryStatus>("all");
  const data = query.data ?? [];
  const rows = data.filter(entry => (filter === "all" || entry.status === filter) && entry.displayName.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <div className="space-y-6">
    <PageTitle eyebrow="PARTICIPANTS" title="参赛者" description={event.name} action={<span className="flex items-center gap-2 text-[var(--muted)]"><Users size={17} />{event.rules.entryMode === "solo" ? "个人赛" : "团体赛"}</span>} />
    <StatGrid items={[{ label: "已报名", value: query.isLoading ? "—" : data.length }, { label: "已通过", value: data.filter(entry => entry.status === "accepted").length }, { label: "待审核", value: data.filter(entry => entry.status === "pending").length }, { label: "参赛上限", value: event.rules.capacity }]} />
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3"><div role="group" aria-label="报名状态筛选" className="flex flex-wrap gap-1">{([['all', '全部'], ['accepted', '已通过'], ['pending', '待审核'], ['rejected', '已驳回'], ['withdrawn', '已撤回']] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-lg px-4 py-2 text-[length:var(--body-size)] ${filter === value ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--panel2)]"}`}>{label}</button>)}</div><label className="relative w-full sm:w-64"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input className="!mt-0 !pl-9 !pr-9" aria-label="搜索参赛者" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索参赛昵称…" />{search && <button aria-label="清除搜索" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)]"><X size={15} /></button>}</label></div>
    {query.isLoading ? <Loading /> : query.error ? <ErrorBox error={query.error} /> : !rows.length ? <Empty title={search || filter !== "all" ? "没有符合条件的参赛者" : "等待首位参赛者"} description={search || filter !== "all" ? "试试其他昵称或报名状态。" : "报名提交后，参赛者会显示在这里。"} /> : <>
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{rows.map(entry => <article key={entry.id} className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 transition-colors hover:border-[var(--accent)]/50"><div className="mb-5 flex items-center justify-between"><span className="font-mono text-[length:var(--label-size)] tracking-wider text-[var(--muted)]">{entry.seed ? `SEED ${String(entry.seed).padStart(2, "0")}` : "UNSEEDED"}</span><Badge status={entry.status} /></div><div className="flex items-center gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-2xl font-semibold text-[var(--accent)]">{entry.displayName.slice(0, 1)}</div><div className="min-w-0"><h2 className="break-words text-[length:var(--section-size)]">{entry.displayName}</h2><p className="mt-1 text-[length:var(--label-size)] text-[var(--muted)]">{event.rules.entryMode === "solo" ? "个人参赛者" : "参赛队伍"}</p></div></div><div className="mt-5 flex items-center gap-2 border-t border-[var(--line)] pt-3 text-[length:var(--label-size)] text-[var(--muted)]"><ShieldCheck size={15} className={entry.status === "accepted" ? "text-[var(--accent)]" : ""} />{entry.status === "accepted" ? "报名审核已通过" : "以主办方审核结果为准"}</div></article>)}</div><p role="status" className="text-right text-[length:var(--label-size)] text-[var(--muted)]">显示 {rows.length} / {data.length} {event.rules.entryMode === "team" ? "队" : "人"}</p>
    </>}
  </div>;
}
