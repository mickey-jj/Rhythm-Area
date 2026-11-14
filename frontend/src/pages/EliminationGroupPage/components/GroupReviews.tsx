import { EvidenceReadAPI } from "../../../apis/events/EvidenceReadAPI";
import { Badge, Panel, SectionHeading } from "../../../components/ui";
import { ReviewCard } from "../../../features/reviews/ReviewCard";
import type { EliminationPageState } from "../objects/EliminationPageState";
export function GroupReviews({page}:{page:EliminationPageState}) {
  if(!page.session || !page.records.length)return null;
  return <Panel><SectionHeading title={page.room.canJudge ? "成绩审核" : "我的交分记录"} /><div className="space-y-4">{page.records.map(attempt=>{
    const detail=<div className="space-y-3 text-base"><div className="grid gap-2">{attempt.items.map(item=><p key={item.slotId} className="flex flex-wrap justify-between gap-3 rounded-lg bg-[var(--panel2)] px-3 py-2"><span>{page.group.charts.find(c=>c.chart_key===item.slotId)?.title ?? "演奏曲目"}</span><strong className="font-mono">{item.value}</strong></p>)}</div><p className="whitespace-pre-wrap break-words text-[var(--muted)]">{attempt.evidenceNote}</p>{attempt.evidenceId && <a className="text-[var(--accent)] underline" target="_blank" rel="noreferrer" href={new EvidenceReadAPI(attempt.evidenceId).url}>查看成绩证据</a>}{attempt.reason && <p className="text-[var(--muted)]">{attempt.reason}</p>}</div>;
    return page.room.canJudge && page.ready ? <ReviewCard key={attempt.id} id={attempt.id} name={attempt.displayName} kind="attempts" status={attempt.status} selfReview={attempt.submittedBy===page.session?.user.id || attempt.entryId===page.myTeam?.entryId}>{detail}</ReviewCard> : <article key={attempt.id} className="space-y-4 rounded-xl border border-[var(--line)] p-4"><header className="flex items-center justify-between gap-3"><h3 className="text-lg">#{attempt.sequence} · {attempt.displayName}</h3><Badge status={attempt.status} /></header>{detail}</article>;
  })}</div></Panel>;
}
