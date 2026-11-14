import type { Ranking, StageRun } from "./types";

export function qualificationRows(rankings: Ranking[], run: StageRun | undefined, next: StageRun | undefined, advance: number, finalRanking = false) {
  const rows: Ranking[] = run?.placements.length ? [...run.placements.flatMap(p => {
    const row = rankings.find(r => r.entry.id === p.entryId);
    return row ? [{ ...row, rank: p.rank }] : [];
  }),...rankings.filter(row=>!run.placements.some(p=>p.entryId===row.entry.id))] : rankings;
  return rows.map(row => ({ ...row, qualification:
    next ? (next.participants.includes(row.entry.id) ? "已晋级" : "未晋级")
      : !row.complete ? "成绩未完成"
      : run?.status === "qualification-tie" ? "等待附加赛判定"
      : run?.status === "completed" ? (finalRanking ? (advance > 1 ? (row.rank !== null && row.rank <= advance ? "获得资格" : "未获资格") : row.rank === 1 ? "冠军" : "已封榜") : "等待后续名单")
      : finalRanking ? "暂列名次"
      : row.rank !== null && row.rank <= advance ? "暂列晋级线内" : "暂列晋级线外",
  }));
}
