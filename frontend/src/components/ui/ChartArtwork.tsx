import { useState } from "react";
import { validArtworkUrl } from "../../domain/artwork";
import { difficultyAppearance } from "../../domain/difficultyAppearance";
import type { LibraryChart } from "../../domain/library";
import { ChartMark } from "./ChartMark";

export function ChartArtwork({ chart, size="medium" }: { chart:LibraryChart; size?:"small"|"medium"|"large"|"preview"|"tile" }) {
  const [failed,setFailed]=useState<string|null>(null);
  const cover=chart.cover_url;
  const tone=difficultyAppearance(chart.game_key,chart.difficulty_label);
  const sizing={tile:"w-full aspect-square",small:"size-14",medium:"size-20",large:"size-24 sm:size-28",preview:"size-56 sm:size-72"}[size];
  return <span data-difficulty-color={tone.color} data-artwork-frame className={`relative block shrink-0 overflow-hidden rounded-2xl border-[3px] bg-[#11181f] shadow-sm ${tone.frame} ${sizing}`}>{cover && cover!==failed && validArtworkUrl(cover) ? <img src={cover} alt={`${chart.title} 曲绘`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className={`size-full ${size==="preview"?"object-contain":"object-cover"}`} onError={()=>setFailed(cover)} /> : <span aria-hidden="true" className="grid size-full place-items-center [&>div]:!size-full [&>div]:!rounded-none"><ChartMark seed={chart.song_key} /></span>}</span>;
}
