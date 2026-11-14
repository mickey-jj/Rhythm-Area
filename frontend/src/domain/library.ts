import type { Chart, Issue } from "./types";
import { normalizeArtworkUrl, validArtworkUrl } from "./artwork.ts";

export type LibraryChart = Omit<Chart, "pool_tag" | "role">;
export const chartRoles = ["ban","pick","random","assign","extra","qualifier","mystery","fixed"] as const;
export type ChartRole = typeof chartRoles[number];
export const isChartRole = (role: string): role is ChartRole => chartRoles.some(value=>value===role);
export type ChartAssignment = { chartKey: string; pools: string[]; roles: ChartRole[] };
export type LibraryImportInput = { gameKey: string; charts: LibraryChart[]; mode: "merge" | "replace" };
export type PoolAssignmentInput = { expectedVersion: number; assignments: ChartAssignment[] };
export type ChartPreset = { gameKey: string; title: string; file: string; chartCount: number; songCount: number; sourceUrl: string; updatedAt: string; coverage: string };
export type ChartSort = "order" | "title" | "artist" | "level-desc" | "level-asc" | "difficulty";
export const games = [
  { key: "paradigm-reboot", title: "Paradigm: Reboot", code: "PR" },
  { key: "phigros", title: "Phigros", code: "PHI" },
  { key: "rotaeno", title: "Rotaeno", code: "ROT" },
  { key: "arcaea", title: "Arcaea", code: "ARC" },
  { key: "maimai-dx", title: "maimai DX", code: "DX" },
  { key: "chunithm", title: "CHUNITHM", code: "CHU" },
] as const;

export const canonicalGameKey = (key: string): string => key.trim().toLowerCase() === "maimai" ? "maimai-dx" : key.trim().toLowerCase();

export const chartLimit = 10000;
export const importByteLimit = 12 * 1024 * 1024;

function csvRows(source: string): Record<string, unknown>[] {
  type State = { rows: string[][]; row: string[]; text: string; quoted: boolean; skip: boolean };
  const separator = source.split(/\r?\n/)[0]?.includes("\t") ? "\t" : ",";
  const state = source.split("").reduce<State>((s, c, index) => {
    if (s.skip) return { ...s, skip: false };
    if (c === '"') return s.quoted && source[index + 1] === '"' ? { ...s, text: s.text + '"', skip: true } : { ...s, quoted: !s.quoted };
    if (!s.quoted && [separator, "\n", "\r"].includes(c)) {
      const row = [...s.row, s.text];
      return c === separator ? { ...s, row, text: "" } : { rows: row.some(Boolean) ? [...s.rows, row] : s.rows, row: [], text: "", quoted: false, skip: c === "\r" && source[index + 1] === "\n" };
    }
    return { ...s, text: s.text + c };
  }, { rows: [], row: [], text: "", quoted: false, skip: false });
  if (state.quoted) throw new Error("CSV 引号未闭合");
  const rows = [...state.rows, ...([...state.row, state.text].some(Boolean) ? [[...state.row, state.text]] : [])];
  const [header, ...body] = rows;
  if (!header) throw new Error("文件为空");
  return body.map(row => Object.fromEntries(header.map((key, index) => [key.trim().toLowerCase(), row[index] ?? ""])));
}

function rowsFromText(text: string): unknown[] {
  const source = text.replace(/^\uFEFF/, "").trim();
  if (!source.startsWith("[") && !source.startsWith("{")) return csvRows(source);
  const parsed: unknown = JSON.parse(source);
  const record = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  const rows = Array.isArray(parsed) ? parsed : record.charts ?? record.rows ?? record.data ?? record.songs ?? record.music;
  if (!Array.isArray(rows)) throw new Error("需要谱面数组或包含 charts 的文件");
  return rows;
}

export function previewLibraryImport(text: string, gameKey: string): { charts: LibraryChart[]; issues: Issue[] } {
  try {
    const rows = rowsFromText(text);
    if (!rows.length || rows.length > chartLimit) throw new Error("谱面数量须为 1–10000");
    const charts = rows.map((row, index): LibraryChart => {
      const raw = row && typeof row === "object" ? Object.fromEntries(Object.entries(row).map(([k,v]) => [k.toLowerCase(),v])) : {};
      const s = (...keys: string[]): string => String(keys.map(key => raw[key]).find(value => typeof value === "string" && value.trim() || typeof value === "number") ?? "").trim();
      const game = canonicalGameKey(s("game_key", "gamekey", "game", "游戏") || gameKey);
      const title = s("title", "name", "song", "曲名", "曲目名称");
      const song = s("song_key", "songkey", "song_id", "songid", "music_id", "曲目id") || title;
      const difficulty = s("difficulty_label", "difficulty", "diff", "难度");
      const type = s("chart_type", "charttype", "type", "谱面类型") || "standard";
      const level = s("level_value", "constant", "ds", "level", "定数");
      return { game_key: game, game_version: s("game_version", "version", "版本"), song_key: song, title, artist: s("artist", "composer", "曲师", "作曲"),
        chart_key: s("chart_key", "chartkey", "id", "谱面id") || `${game}:${song}:${type}:${difficulty}`, chart_type: type, difficulty_label: difficulty,
        level_value: level && Number.isFinite(Number(level)) ? Number(level) : null, display_order: index + 1,
        cover_url: normalizeArtworkUrl(s("cover_url", "coverurl", "cover", "jacket_url", "artwork", "image_url", "曲绘")) || null };
    });
    const keys = charts.map(c => c.chart_key).toSorted();
    const duplicates = new Set(keys.filter((key, index) => index > 0 && key === keys[index - 1]));
    const issues = charts.flatMap((c, index) => [
      ...(!c.title || !c.difficulty_label ? [{ fieldPath: `第 ${index + 1} 条`, message: "曲名与难度必填" }] : []),
      ...(c.game_key !== canonicalGameKey(gameKey) ? [{ fieldPath: `第 ${index + 1} 条`, message: `游戏须为 ${gameKey}` }] : []),
      ...(c.cover_url && !validArtworkUrl(c.cover_url) ? [{ fieldPath: `第 ${index + 1} 条`, message: "曲绘地址无效" }] : []),
      ...(duplicates.has(c.chart_key) ? [{ fieldPath: `第 ${index + 1} 条`, message: `重复谱面：${c.chart_key}` }] : []),
    ]);
    return { charts, issues };
  } catch (error) {
    return { charts: [], issues: [{ fieldPath: "文件", message: error instanceof SyntaxError ? "JSON 格式不正确" : error instanceof Error ? error.message : "文件无法读取" }] };
  }
}

export function queryCharts<T extends LibraryChart>(charts: readonly T[], query: { search: string; sort: ChartSort; difficulty?: string; minimum?: string; maximum?: string }): T[] {
  const text = query.search.normalize("NFKC").trim().toLocaleLowerCase();
  const selected = charts.filter(c => (!text || [c.title,c.artist,c.chart_key,c.song_key,c.difficulty_label,c.chart_type].join(" ").normalize("NFKC").toLocaleLowerCase().includes(text))
    && (!query.difficulty || c.difficulty_label === query.difficulty)
    && (!query.minimum || c.level_value !== null && c.level_value >= Number(query.minimum))
    && (!query.maximum || c.level_value !== null && c.level_value <= Number(query.maximum)));
  const compare = (a: T, b: T): number => {
    switch (query.sort) {
      case "title": return a.title.localeCompare(b.title, "zh-CN", { numeric: true });
      case "artist": return a.artist.localeCompare(b.artist, "zh-CN");
      case "difficulty": return a.difficulty_label.localeCompare(b.difficulty_label, "en", { numeric: true });
      case "level-desc": return (b.level_value ?? -Infinity) - (a.level_value ?? -Infinity);
      case "level-asc": return (a.level_value ?? Infinity) - (b.level_value ?? Infinity);
      case "order": return a.display_order - b.display_order;
    }
  };
  return selected.toSorted((a,b) => compare(a,b) || a.chart_key.localeCompare(b.chart_key));
}

export const assignmentsFromCharts = (charts: readonly Chart[]): ChartAssignment[] => charts.map(c => ({ chartKey: c.chart_key, pools: c.pool_tag.split("|").map(p=>p.trim()).filter(Boolean), roles: c.role.split(/[|,]/).map(r=>r.trim()).filter(isChartRole) }));
export function assignCharts(current: readonly ChartAssignment[], keys: readonly string[], pool: string, roles: readonly ChartRole[]): ChartAssignment[] {
  const selected = new Set(keys);
  const existing = new Set(current.map(a => a.chartKey));
  return [...current.map(a => selected.has(a.chartKey) ? { ...a, pools: [...new Set([...a.pools, pool])], roles: [...new Set([...a.roles, ...roles])] } : a),
    ...keys.filter(key => !existing.has(key)).map(chartKey => ({ chartKey, pools: [pool], roles: [...roles] }))];
}
export function removeFromPool(current: readonly ChartAssignment[], keys: readonly string[], pool: string): ChartAssignment[] {
  const selected = new Set(keys);
  return current.map(a => selected.has(a.chartKey) ? { ...a, pools: a.pools.filter(p => p !== pool) } : a).filter(a => a.pools.length > 0);
}
