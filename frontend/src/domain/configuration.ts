import type { Chart,DraftStep,RuleSet } from "./types";
export function reconcilePlayOrder(
  r: RuleSet,
  draft: DraftStep[],
): RuleSet["playOrder"] {
  const sources = draft
    .filter((s) => ["pick", "random", "assign"].includes(s.action))
    .flatMap((s) =>
      Array.from(
        { length: Math.max(0, Math.min(20, s.count)) },
        (_, i) => `${s.id}:${i + 1}`,
      ),
    );
  const kept = r.playOrder.filter(
    (s, i, all) =>
      (sources.includes(s.source) || s.source.startsWith("fixed:")) &&
      all.findIndex((x) => x.source === s.source) === i,
  );
  return [
    ...kept,
    ...sources
      .filter((source) => !kept.some((s) => s.source === source))
      .map((source) => ({ id: `song-${source}`, source })),
  ];
}
export function resizeStages(
  stages: RuleSet["stages"],
  capacity: number,
): RuleSet["stages"] {
  return stages.reduce<RuleSet["stages"]>((result, stage, index) => {
    const incoming = index === 0 ? capacity : result[index - 1].advance;
    return [
      ...result,
      {
        ...stage,
        advance:
          index === stages.length - 1
            ? stage.kind === "ranking" ? Math.max(1, Math.min(stage.advance, incoming)) : 1
            : Math.max(2, Math.min(stage.advance, incoming)),
      },
    ];
  }, []);
}
export function patchRules(r: RuleSet, patch: Partial<RuleSet>): RuleSet {
  const next = { ...r, ...patch };
  return { ...next,
    stages: patch.capacity !== undefined ? resizeStages(next.stages, next.capacity) : next.stages,
    playOrder: patch.draft ? reconcilePlayOrder(r, patch.draft) : next.playOrder,
  };
}
export function importSamples(
  gameKey: string,
): { id: string; title: string; description: string; charts: Chart[] }[] {
  const chart = (n: number, pool: string, role: string): Chart => ({
    game_key: gameKey,
    game_version: "自定义",
    song_key: `sample-song-${n}`,
    chart_key: `sample-chart-${n}`,
    title: `示例曲目 ${n}`,
    artist: "请替换为实际曲目",
    chart_type: "standard",
    difficulty_label: "EXPERT",
    level_value: null,
    pool_tag: pool,
    role,
    display_order: n,
  });
  return [
    {
      id: "single",
      title: "单行填写模板",
      description: "一行正式曲谱面，适合照着填入自己的数据。",
      charts: [chart(1, "main", "ban|pick|random")],
    },
    {
      id: "complete",
      title: "完整分池示例",
      description:
        "8 张正式曲、3 张海选、3 张加赛。曲目均为占位数据，正式使用前请替换。",
      charts: Array.from({ length: 14 }, (_, i) =>
        chart(
          i + 1,
          i < 8 ? "main" : i < 11 ? "qualifier" : "extra",
          i < 8 ? "ban|pick|random" : i < 11 ? "qualifier" : "extra",
        ),
      ),
    },
  ];
}

export const poolTags = (c: Chart): string[] => [
  ...new Set(
    c.pool_tag
      .split(/[|,]/)
      .map((s) => s.trim())
      .filter(Boolean),
  ),
];
