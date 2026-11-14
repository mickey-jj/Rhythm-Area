import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const pageUrl = 'https://prp.icel.site/#/songs';
const apiUrl = 'https://api.prp.icel.site/api/v2/songs';
const file = (name) => new URL(name, import.meta.url);
const offline = process.argv.includes('--offline');
if (process.argv.slice(2).some((arg) => arg !== '--offline')) {
  throw new Error('Usage: node sync.mjs [--offline]');
}

// Keep acquisition at the boundary; normalize only after validating the whole response.
const response = offline ? null : await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
if (response && !response.ok) throw new Error(`Public API returned HTTP ${response.status}`);
const raw = offline ? await readFile(file('source.json')) : Buffer.from(await response.arrayBuffer());
const retrievedAt = offline
  ? (JSON.parse(await readFile(file('manifest.json'), 'utf8').catch(() => 'null'))?.retrieved_at
    ?? (await stat(file('source.json'))).mtime.toISOString())
  : new Date().toISOString();
const source = JSON.parse(raw.toString('utf8'));
const difficulties = ['detected', 'invaded', 'massive', 'reboot'];
if (!Array.isArray(source) || source.length === 0) throw new Error('Expected a non-empty chart array');
source.forEach((chart, index) => {
  const valid = Number.isSafeInteger(chart.id) && chart.id > 0
    && Number.isSafeInteger(chart.song_id) && chart.song_id > 0
    && ['title', 'artist', 'version'].every((key) => typeof chart[key] === 'string' && chart[key].length > 0)
    && /^\d+\.\d+\.\d+$/.test(chart.version)
    && difficulties.includes(chart.difficulty)
    && Number.isFinite(chart.level) && chart.level > 0;
  if (!valid) throw new Error(`Invalid source chart at row ${index + 1}`);
});
const uniqueCount = (values) => new Set(values).size;
if (uniqueCount(source.map((chart) => chart.id)) !== source.length) throw new Error('Duplicate chart ID');
if (uniqueCount(source.map((chart) => `${chart.song_id}:${chart.difficulty}`)) !== source.length) {
  throw new Error('Duplicate song/difficulty pair; review upstream data before importing');
}

const columns = [
  'game_key', 'game_version', 'song_key', 'title', 'artist', 'chart_key',
  'chart_type', 'difficulty_label', 'level_value', 'pool_tag', 'role', 'display_order',
];
const rows = source.map((chart, index) => ({
  game_key: 'paradigm-reboot',
  game_version: chart.version,
  song_key: `prp-song-${chart.song_id}`,
  title: chart.title,
  artist: chart.artist,
  chart_key: `prp-chart-${chart.id}`,
  chart_type: 'standard',
  difficulty_label: chart.difficulty.toUpperCase(),
  level_value: chart.level,
  pool_tag: 'all',
  role: '',
  display_order: index + 1,
}));
const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
const csv = '\uFEFF' + [columns, ...rows.map((row) => columns.map((column) => row[column]))]
  .map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
const json = JSON.stringify(rows, null, 2) + '\n';
const hash = (data) => createHash('sha256').update(data).digest('hex');
const songIds = [...new Set(source.map((chart) => chart.song_id))];
const variants = songIds.flatMap((songId) => {
  const charts = source.filter((chart) => chart.song_id === songId);
  const values = [...new Set(charts.map((chart) => JSON.stringify([chart.title, chart.artist])))];
  return values.length > 1 ? [{
    source_song_id: songId,
    variants: values.map((value) => {
      const [title, artist] = JSON.parse(value);
      return { title, artist, source_chart_ids: charts.filter((chart) => chart.title === title && chart.artist === artist).map((chart) => chart.id) };
    }),
  }] : [];
});
const manifest = {
  schema_version: 1,
  provider: 'prp',
  game_key: 'paradigm-reboot',
  source_page: pageUrl,
  source_api: apiUrl,
  retrieved_at: retrievedAt,
  scope: 'All charts returned by the public PRP songs API; no difficulty or season filter',
  version_semantics: 'game_version preserves the upstream chart version; it is not a verified current client or region version',
  latest_source_chart_version: source.map((chart) => chart.version).sort((a, b) => b.localeCompare(a, 'en', { numeric: true }))[0],
  song_count: songIds.length,
  chart_count: rows.length,
  difficulty_counts: Object.fromEntries(difficulties.map((difficulty) => [difficulty.toUpperCase(), source.filter((chart) => chart.difficulty === difficulty).length])),
  level_range: { min: Math.min(...source.map((chart) => chart.level)), max: Math.max(...source.map((chart) => chart.level)) },
  title_artist_variants: variants,
  missing_fitting_level_count: source.filter((chart) => chart.fitting_level == null).length,
  validation: { required_fields_valid: true, unique_chart_ids: true, unique_song_difficulty_pairs: true },
  files: Object.fromEntries([['source.json', raw], ['charts.csv', Buffer.from(csv)], ['charts.json', Buffer.from(json)]]
    .map(([name, data]) => [name, { bytes: data.length, sha256: hash(data) }])),
};

if (!offline) await writeFile(file('source.json'), raw);
await writeFile(file('charts.csv'), csv);
await writeFile(file('charts.json'), json);
await writeFile(file('manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ songs: manifest.song_count, charts: manifest.chart_count, difficulty_counts: manifest.difficulty_counts, title_artist_variants: variants.length }));
