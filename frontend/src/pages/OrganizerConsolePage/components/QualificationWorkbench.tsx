import type { Event } from "../../../domain/types";
import { useRankingStage } from "../../../features/ranking/useRankingStage";
import { RankingClock } from "../../../features/ranking/RankingClock";
import { QualifierOrder } from "./QualifierOrder";

export function QualificationWorkbench({ event }: { event: Event }) {
  const page = useRankingStage(event);
  if (page.status === "empty") return null;
  const board = page.board.data;
  const decision = board?.qualificationDecision;
  const ranked = board?.rankings.filter(row => row.complete) ?? [];
  const canRecord = board?.session.status === "closed" || ranked.length === board?.rankings.length;

  return <div className="space-y-5">
    <RankingClock page={page} compact />
    {decision && <QualifierOrder key={decision.snapshotKey} event={event}
      rows={ranked} decision={decision} canRecord={canRecord} />}
    <p className="text-sm text-[var(--muted)]">手动截止且全员已有完整成绩时，确认晋级会同时关闭收分。</p>
  </div>;
}
