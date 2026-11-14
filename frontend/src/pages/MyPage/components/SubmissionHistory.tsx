import { FileCheck2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Empty, ErrorBox, Loading, Panel, SectionHeading } from "../../../components/ui";
import type { MyPageReady } from "../objects/MyPageState";
export function SubmissionHistory({ page }: { page: MyPageReady }) {
  const { attempts, records } = page;
  return (
<Panel><SectionHeading title="我的提交记录" action={<FileCheck2 size={20} className="text-[var(--muted)]" />} />{attempts.isLoading ? <Loading /> : attempts.error ? <ErrorBox error={attempts.error} /> : !records.length ? <Empty title="暂无成绩提交" description="提交后的每次尝试及审核状态都会保留。" /> : <div className="space-y-3">{records.map(attempt => <article key={attempt.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--line)] p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--panel2)] font-mono text-sm text-[var(--muted)]">#{attempt.sequence}</span><div className="min-w-0 flex-1"><p className="break-words font-mono text-[length:var(--body-size)]">{attempt.items.map(item => item.value).join(" / ")}</p><p className="mt-2 text-[length:var(--label-size)] text-[var(--muted)]">{attempt.matchId ? "正赛" : "海选"} · {attempt.reason ?? (attempt.status === "approved" ? "审核通过" : "等待审核")}</p>{attempt.matchId && <Link to={`/matches/${attempt.matchId}`} className="mt-2 inline-block text-[length:var(--label-size)] text-[var(--accent)] hover:underline">查看对应比赛 →</Link>}</div><Badge status={attempt.status} /></article>)}</div>}</Panel>
  );
}
