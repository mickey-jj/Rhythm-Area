import type { LibraryChart } from "./library";

export function normalizeArtworkUrl(source:string): string {
  const value=source.trim();
  if(value.startsWith("/api/artwork/"))return value;
  try { return new URL(value).href; } catch { return value; }
}

export function validArtworkUrl(source: string | null | undefined): boolean {
  if (!source || source.length > 2048) return false;
  if (/^\/api\/artwork\/[a-f0-9]{64}\.(png|jpg|webp)$/.test(source)) return true;
  try {
    const url = new URL(source);
    return ["http:","https:"].includes(url.protocol) && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export type ArtworkMatch = { file: File; songs: LibraryChart[] };
export function matchArtworkFiles(files: readonly File[], charts: readonly LibraryChart[]): ArtworkMatch[] {
  const normalize = (s: string) => s.normalize("NFKC").trim().toLocaleLowerCase();
  return files.map(file => {
    const key = normalize(file.name.replace(/\.(png|jpe?g|webp)$/i,""));
    const matches = charts.filter(c => [c.song_key,c.chart_key,c.title].some(value => normalize(value)===key));
    return { file, songs: [...new Map(matches.map(c=>[c.song_key,c])).values()] };
  });
}
