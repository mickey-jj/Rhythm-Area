import type { Attempt,Entry,Event } from "../../../domain/types";
import type { RankingBoard } from "../../../domain/ranking";

export type QualificationBlocker = {
  message: string;
  target?: "entries" | "scores" | "ranking-controls" | "qualification-order" | "retry";
};

export function qualificationReadiness(
  event: Event,
  entries: readonly Entry[],
  attempts: readonly Attempt[],
  board: RankingBoard | undefined,
  boardFailed = false,
): QualificationBlocker[] {
  const accepted = entries.filter(entry => entry.status === "accepted").length;
  const pending = attempts.filter(attempt => attempt.status === "pending" && !attempt.matchId && !attempt.groupId).length;
  const qualifier = event.rules.stages[0]?.kind === "ranking" ? event.rules.stages[0] : null;
  const complete = board?.rankings.filter(row => row.complete).length ?? 0;
  const needed = Math.min(qualifier?.advance ?? 2, accepted);
  const needsClosure = board && board.session.status !== "closed" &&
    !(board.session.policy.endMode === "manual" && complete === accepted);
  const decision = board?.qualificationDecision;

  return [
    ...(accepted < 2 ? [{ message: `已通过报名 ${accepted} 方，至少需要 2 方`, target: "entries" as const }] : []),
    ...(pending ? [{ message: `还有 ${pending} 份成绩待审核`, target: "scores" as const }] : []),
    ...(!qualifier ? [] : boardFailed
      ? [{ message: "暂时无法核对排名赛状态", target: "retry" as const }]
      : !board ? [{ message: "正在加载排名赛状态" }]
      : [
        ...(needsClosure ? [{ message: "先停止排名赛收分，或等待配置的截止条件满足", target: "ranking-controls" as const }] : []),
        ...(complete < needed ? [{ message: `完整有效成绩 ${complete} 方，需 ${needed} 方；可重新开放收分补齐`, target: "ranking-controls" as const }] : []),
        ...(decision?.status === "required" ? [{ message: "排名赛有同分尚未判定", target: "qualification-order" as const }] : []),
        ...(decision?.status === "stale" ? [{ message: "有效成绩已变化，旧的同分判定已失效", target: "qualification-order" as const }] : []),
      ]),
  ];
}
