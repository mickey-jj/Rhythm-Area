import { Badge, Empty, ErrorBox, Loading, Panel, SectionHeading } from "../../../components/ui";
import { AttemptForm } from "../../../features/scoring/AttemptForm";
import { TeamQualifier } from "../../../features/scoring/TeamQualifier";
import { AttemptScores } from "../../../features/scoring/AttemptScores";
import {useEffect,useRef} from "react";
import {useLocation} from "react-router-dom";
import type { QualifierReady } from "../../../features/ranking/RankingStage";

export function QualifierSubmissions({ page }: { page: QualifierReady }) {
  const { event, session, entries, mine, slots, attempts, myAttempts } = page;
  const target=useRef<HTMLDivElement>(null),{hash}=useLocation();
  useEffect(()=>{if(hash==="#ranking-submit"&&!page.board.isLoading&&!entries.isLoading)target.current?.scrollIntoView({block:"start"});},[hash,page.board.isLoading,entries.isLoading]);
  return (
    <div ref={target} id="ranking-submit" className="scroll-mt-24 grid items-start gap-6 lg:grid-cols-2"><Panel><SectionHeading title="提交成绩" />{entries.error ? <ErrorBox error={entries.error} /> : mine && page.accepting ? event.rules.entryMode === "team" ? <TeamQualifier event={event} entry={mine} slots={slots} /> : <AttemptForm event={event} entry={mine} slots={slots} metric={event.rules.metric} /> : <p className="rounded-xl bg-[var(--panel2)] p-4 leading-relaxed text-[var(--muted)]">{event.status === "draft" ? "排名赛尚未开放" : event.status === "registration" && page.board.data?.session.status==="open" ? "通过报名后可提交成绩" : "当前未开放收分"}</p>}</Panel>
      {session && <Panel><SectionHeading title="我的刷分记录" />{attempts.isLoading ? <Loading /> : attempts.error ? <ErrorBox error={attempts.error} /> : !myAttempts.length ? <Empty title="还没有提交记录" /> : <div className="space-y-3">{myAttempts.map(attempt => <article key={attempt.id} className="rounded-xl border border-[var(--line)] p-4"><div className="flex items-center justify-between gap-3"><span className="font-mono text-sm">尝试 #{attempt.sequence}</span><Badge status={attempt.status} /></div><AttemptScores attempt={attempt} showEvidence /><p className="text-[length:var(--label-size)] text-[var(--muted)]">{attempt.reason ?? (attempt.status === "approved" ? "已审核通过" : "等待审核意见")}</p></article>)}</div>}</Panel>}
    </div>
  );
}
