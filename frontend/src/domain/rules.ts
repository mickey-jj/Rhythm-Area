import type { Chart,EventInput,Issue,RuleSet } from "./types";
import { validArtworkUrl } from "./artwork.ts";
export function ruleSummary(r: RuleSet): string[] {
  return [
    `${r.entryMode === "solo" ? "个人赛" : "团体赛"} · ${r.capacity} 个名额`,
    `${r.metric.name} ${r.metric.minimum}–${r.metric.maximum}${r.metric.unit} · ${r.metric.decimals} 位小数`,
    r.stages.length === 1 && r.stages[0].kind === "ranking"
      ? r.stages[0].advance > 1 ? `资格排名 · 取前 ${r.stages[0].advance} 方` : "独立排名赛 · 封榜后确定冠军"
      : `${r.playOrder.length} 曲${r.matchMode === "total" ? "总和，全部演奏" : `，先到 ${r.winsRequired} 个曲胜`}`,
    r.stages.length === 1 && r.stages[0].kind === "ranking"
      ? "资格同分须记录实际附加赛判定"
      : r.resolution.tie === "extra"
        ? `同分追加 ${r.resolution.extraCount} 曲 · ${r.resolution.scope === "extra-only" ? "只比较本组加赛" : "累计全部成绩"}`
        : "同分暂停，等待裁判",
  ];
}
// Import parsing is a pure calculation; it never mutates the live pool before confirmation.
function parseCSV(source: string): string[][] {
  type State = { rows: string[][]; row: string[]; value: string; quoted: boolean; skip: boolean };
  const state = source.split("").reduce<State>((s, c, i) => {
    if (s.skip) return { ...s, skip: false };
    if (c === '"') return s.quoted && source[i + 1] === '"'
      ? { ...s, value: s.value + '"', skip: true }
      : { ...s, quoted: !s.quoted };
    if (!s.quoted && [",", "\n", "\r"].includes(c)) {
      const row = [...s.row, s.value];
      return c === "," ? { ...s, row, value: "" }
        : { rows: row.some(Boolean) ? [...s.rows, row] : s.rows, row: [], value: "", quoted: false, skip: c === "\r" && source[i + 1] === "\n" };
    }
    return { ...s, value: s.value + c };
  }, { rows: [], row: [], value: "", quoted: false, skip: false });
  if (state.quoted) throw new Error("CSV 引号未闭合");
  const row = [...state.row, state.value];
  return row.some(Boolean) ? [...state.rows, row] : state.rows;
}
function importRows(text: string): unknown {
  const s = text.replace(/^\uFEFF/, "").trim();
  if (s.startsWith("[") || s.startsWith("{")) {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : parsed.charts;
  }
  const [head, ...rows] = parseCSV(s);
  if (!head) throw new Error("文件为空");
  return rows.map(row => Object.fromEntries(head.map((key, i) => [key.trim(), row[i] ?? ""])));
}
export function previewImport(
  text: string,
  gameKey: string,
): { charts: Chart[]; issues: Issue[] } {
  try {
    return validateImportRows(importRows(text), gameKey);
  } catch (e) {
    return {
      charts: [],
      issues: [
        {
          fieldPath: "file",
          message: e instanceof SyntaxError ? "JSON 格式不正确，请检查双引号、逗号和括号。" : e instanceof Error ? e.message : "无法解析文件",
        },
      ],
    };
  }
 }
function validateImportRows(input: unknown, gameKey: string): { charts: Chart[]; issues: Issue[] } {
  if (!Array.isArray(input) || input.length > 10000)
    return {
      charts: [],
      issues: [
        {
          fieldPath: "file",
          message: "需要不超过 10000 行的 JSON 数组或 CSV 表格",
        },
      ],
    };
  const charts = input.map((raw: unknown, i) => {
    const r =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const s = (key: string) =>
      typeof r[key] === "string" ? (r[key] as string).trim() : "";
    const chart: Chart = {
      game_key: s("game_key"),
      game_version: s("game_version"),
      song_key: s("song_key"),
      title: s("title"),
      artist: s("artist"),
      chart_key: s("chart_key"),
      chart_type: s("chart_type") || "standard",
      difficulty_label: s("difficulty_label"),
      level_value:
        r.level_value === "" || r.level_value == null
          ? null
          : Number(r.level_value),
      pool_tag: s("pool_tag") || "main",
      role: s("role"),
      display_order: i + 1,
      cover_url: s("cover_url") || null,
    };
    return chart;
  });
  const sortedKeys = charts.map(c => c.chart_key).toSorted();
  const duplicateKeys = new Set(sortedKeys.filter((key, i) => i > 0 && key === sortedKeys[i - 1]));
  const issues = charts.flatMap((chart, i): Issue[] => {
    const issue = (condition: boolean, message: string): Issue[] => condition ? [{ fieldPath: `第 ${i + 2} 行`, message }] : [];
    return [
      ...issue(!chart.chart_key || !chart.song_key || !chart.title || !chart.difficulty_label, "缺少谱面键、曲目键、曲名或难度"),
      ...issue(chart.game_key !== gameKey, `game_key 须为 ${gameKey}`),
      ...issue(duplicateKeys.has(chart.chart_key), "谱面键重复，不按曲名合并"),
      ...issue(!!chart.cover_url && !validArtworkUrl(chart.cover_url), "曲绘地址无效"),
      ...issue(chart.level_value != null && !Number.isFinite(chart.level_value), "定数不是有效数值"),
    ];
  });
  return { charts, issues };
}
function hasShape(value: unknown, schema: unknown): boolean {
  if (schema == null) return true;
  if (Array.isArray(schema))
    return (
      Array.isArray(value) &&
      value.length <= 256 &&
      schema.length > 0 &&
      value.every((item) => hasShape(item, schema[0]))
    );
  if (schema && typeof schema === "object")
    return (
      !!value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.entries(schema).every(([key, sample]) =>
        hasShape((value as Record<string, unknown>)[key], sample),
      )
    );
  return (
    typeof value === typeof schema &&
    (typeof value !== "number" || Number.isFinite(value))
  );
}
export function decodeEventTemplate(
  text: string,
  ruleSchema: RuleSet,
): EventInput {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object")
    throw new Error("不是有效的赛事模板");
  const v = value as Record<string, unknown>;
  if (
    v.format !== "rhythm-area-template" ||
    v.schemaVersion !== 1 ||
    typeof v.name !== "string" ||
    typeof v.tagline !== "string" ||
    typeof v.description !== "string" ||
    !hasShape(v.rules, ruleSchema) ||
    !Array.isArray(v.charts)
  )
    throw new Error("模板格式不正确或版本尚未支持");
  const rules = v.rules as RuleSet;
  const preview = previewImport(JSON.stringify(v.charts), rules.gameKey);
  if (preview.issues.length) throw new Error(preview.issues[0].message);
  const appearance = v.appearance as Record<string, unknown> | undefined;
  if (
    appearance &&
    (typeof appearance.brandName !== "string" ||
      !appearance.brandName.trim() ||
      appearance.brandName.length > 50 ||
      typeof appearance.accentColor !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(appearance.accentColor) ||
      typeof appearance.contact !== "string" ||
      appearance.contact.length > 500)
  )
    throw new Error("网站标识、主题色或联系信息格式不正确");
  return {
    name: v.name,
    tagline: v.tagline,
    description: v.description,
    rules,
    charts: preview.charts,
    ...(appearance
      ? {
          appearance: {
            brandName: appearance.brandName as string,
            accentColor: appearance.accentColor as string,
            contact: appearance.contact as string,
          },
        }
      : {}),
  };
}
