import { QualificationWorkbench } from "./QualificationWorkbench";
import { ArrowRight, ArrowUpRight, GitBranch, History } from "lucide-react";
import { Link } from "react-router-dom";
import { PostEventsByIdArchiveAPI } from "../../../apis/events/PostEventsByIdArchiveAPI";
import { Badge, ErrorBox, Loading, Panel } from "../../../components/ui";
import type { Event } from "../../../domain/types";
import { useOrganizerReviews } from "../hooks/useOrganizerReviews";
import { reviewTabs } from "../objects/ReviewTab";
import { AuditPanel, EntryReviews, ScoreReviews } from "./ReviewPanels";

export function OrganizerReviews({ event }: { event: Event }) {
  const { status, loadError, session, tab, setTab, error, setError, confirm, setConfirm, busy, setBusy, entries, scores, audit, matches, refresh, generate, blockers, retryRanking } = useOrganizerReviews(event);
  if (status === "loading") return <Loading />;
  if (status === "error") return <ErrorBox error={loadError} />;
  async function archive() {
    setBusy(true); setError(null);
    await new PostEventsByIdArchiveAPI(event.id, { expectedVersion: event.version }).send().then(() => refresh()).catch(setError).finally(() => setBusy(false));
  }
  return <div className="mb-6 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"><div className="min-w-0"><div className="mb-1"><Badge status={event.status} /></div><h2 className="break-words text-lg">{event.name}</h2><p className="mt-2 text-[length:var(--label-size)] text-[var(--muted)]">{event.rules.gameName} · 规则 v{event.ruleVersion}</p></div><div className="flex flex-wrap gap-2"><Link to="/" className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm">查看赛事<ArrowUpRight size={15} /></Link>{event.status === "completed" && <button disabled={busy} onClick={archive} className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--muted)]">归档并保留全部记录</button>}{event.status!=="archived"&&<Link to="/manage/config" className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-[var(--on-accent)]">修改赛制<ArrowRight size={15} /></Link>}</div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{([{tab:"entries",label:"待审报名",value:entries.data?.filter(a=>a.status==="pending").length??0},{tab:"scores",label:"成绩待审核",value:scores.data?.filter(a=>a.status==="pending").length??0},{tab:"schedule",label:"开赛与晋级",value:matches.data?.filter(m=>!["finalized","bye","empty","cancelled"].includes(m.status)).length??0},{tab:"audit",label:"操作记录",value:audit.data?.length??0}] as const).map(item=><button key={item.tab} onClick={()=>setTab(item.tab)} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 text-left hover:border-[var(--accent)]"><span className="block text-sm text-[var(--muted)]">{item.label}</span><b className="mt-1 block font-mono text-2xl">{item.value}</b></button>)}</div>

    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)]"><div role="group" aria-label="赛务工作分类" className="flex flex-wrap gap-1 border-b border-[var(--line)] p-3">{reviewTabs.map(([key, label]) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-[length:var(--body-size)] ${tab === key ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--panel2)]"}`}>{key === "audit" && <History size={15} />}{label}{key === "entries" && !!entries.data?.some(entry => entry.status === "pending") && <span className="size-1.5 rounded-full bg-[var(--warning)]" />}</button>)}</div><div className="min-w-0 p-5 sm:p-6">{error != null && <ErrorBox error={error} />}{entries.error || scores.error || audit.error ? <ErrorBox error={entries.error ?? scores.error ?? audit.error} /> : tab === "entries" ? <EntryReviews entries={entries.data ?? []} /> : tab === "scores" ? <ScoreReviews attempts={scores.data ?? []} userId={session.user.id} /> : tab === "audit" ? <AuditPanel logs={audit.data ?? []} /> : (
        <div className="space-y-4">
          <h2 className="text-[length:var(--section-size)]">开赛与封榜</h2>
          {event.status === "registration" && (
            <section className="rounded-xl border border-[var(--line)] p-4" aria-labelledby="launch-check-title">
              <h3 id="launch-check-title">开赛前检查</h3>
              {blockers.length ? (
                <ul className="mt-3 space-y-2">
                  {blockers.map(({ message, target }) => (
                    <li key={message} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>{message}</span>
                      {(target === "ranking-controls" || target === "qualification-order") && (
                        <a className="text-[var(--accent)] underline" href={`#${target}`}>
                          {target === "qualification-order" ? "前往同分判定" : "查看收分控制"}
                        </a>
                      )}
                      {(target === "entries" || target === "scores") && (
                        <button type="button" className="text-[var(--accent)] underline" onClick={() => setTab(target)}>前往处理</button>
                      )}
                      {target === "retry" && (
                        <button type="button" className="text-[var(--accent)] underline" onClick={() => retryRanking()}>重试检查</button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-[var(--accent)]">开赛条件已满足，可以确认晋级。</p>}
            </section>
          )}
          <QualificationWorkbench event={event} />
          {event.status === "registration" ? (
            confirm ? (
              <Panel className="border-[var(--warning)]/30">
                <h3 className="mb-2">确认开启正赛？</h3>
                <p className="mb-4 text-sm text-[var(--muted)]">确认后将冻结晋级名单并生成赛程。</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setConfirm(false)} className="rounded-lg border border-[var(--line)] px-4 py-2.5">返回</button>
                  <button type="button" disabled={busy || blockers.length > 0} onClick={generate}
                    className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-[var(--on-accent)]">
                    {busy ? "生成中…" : "确认并生成赛程"}
                  </button>
                </div>
              </Panel>
            ) : (
              <button type="button" disabled={blockers.length > 0} onClick={() => setConfirm(true)}
                className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-[var(--on-accent)]">
                <GitBranch size={17} />预备开赛 / 排名封榜
              </button>
            )
          ) : (
            <Link to="/schedule" className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-3 text-[var(--accent)]">
              查看对阵与进度<ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}</div></section>
  </div>;
}
