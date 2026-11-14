import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi, useRefresh } from "../../../api/client";
import { GetLibraryAPI } from "../../../apis/events/GetLibraryAPI";
import { PutLibraryAPI } from "../../../apis/events/PutLibraryAPI";
import { GetChartPresetsAPI } from "../../../apis/instance/GetChartPresetsAPI";
import { GetChartPresetsByGameAPI } from "../../../apis/instance/GetChartPresetsByGameAPI";
import { useInstance } from "../../../app/InstanceContext";
import { canonicalGameKey, importByteLimit, previewLibraryImport, queryCharts, type ChartSort, type LibraryImportInput } from "../../../domain/library";

import { useLibraryArtwork } from "./useLibraryArtwork";

export function useChartLibrary() {
  const instance = useInstance();
  const refresh = useRefresh();
  const [params, setParams] = useSearchParams();
  const game = canonicalGameKey(params.get("game") ?? instance.event?.rules.gameKey ?? "paradigm-reboot");
  const library = useApi(new GetLibraryAPI(game), instance.isOwner);
  const presets = useApi(new GetChartPresetsAPI(), instance.isOwner);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ChartSort>("title");
  const [difficulty, setDifficulty] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [importing, setImporting] = useState(false);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof previewLibraryImport> | null>(null);
  const [previewPage,setPreviewPage]=useState(1);
  const [mode, setMode] = useState<LibraryImportInput["mode"]>("merge");
  const [busy, setBusy] = useState<"" | "preset" | "import">("");
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState("");
  const rows = library.data ?? [];
  const artwork=useLibraryArtwork(game,rows,async notice=>{await refresh();setNotice(notice);});
  const filtered = useMemo(() => queryCharts(rows, { search, sort, difficulty }), [rows, search, sort, difficulty]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page,pages);
  const visible = filtered.slice((activePage-1)*pageSize,activePage*pageSize);
  const difficulties = [...new Set(rows.map(c => c.difficulty_label))].toSorted();
  function chooseGame(next: string) { setParams({ game: next }, { replace: true }); setPage(1); setSearch(""); setDifficulty(""); setError(null); setNotice(""); }
  function inspect(value: string) { setText(value); setPreview(previewLibraryImport(value,game)); setPreviewPage(1);setError(null); }
  function openImport() { setText(""); setPreview(null); setError(null); setMode("merge"); setImporting(true); }
  async function readFile(file: File) {
    if (file.size > importByteLimit) { setError(new Error("文件超过 12 MB")); setPreview(null); return; }
    await file.text().then(inspect).catch(setError);
  }
  async function loadPreset() {
    if (busy) return;
    setBusy("preset"); setError(null);
    await new GetChartPresetsByGameAPI(game).send().then(charts => { inspect(JSON.stringify(charts,null,2)); setMode("merge"); setImporting(true); }).catch(setError).finally(() => setBusy(""));
  }
  async function confirmImport() {
    if (busy || !preview?.charts.length || preview.issues.length) return;
    setBusy("import"); setError(null);
    await new PutLibraryAPI({ gameKey: game, charts: preview.charts, mode }).send().then(async charts => {
      await refresh(); setNotice(`已保存 · ${charts.length.toLocaleString()} 张谱面`); setImporting(false); setPage(1);
    }).catch(setError).finally(() => setBusy(""));
  }
  return { artwork,previewPage,setPreviewPage,instance, game, chooseGame, library, presets, rows, search, setSearch, sort, setSort, difficulty, setDifficulty, difficulties, page:activePage, setPage, pageSize,setPageSize,pages, filtered,visible, importing,setImporting,text,setText,preview,setPreview,mode,setMode,busy,error,notice,inspect,readFile,openImport,loadPreset,confirmImport };
}
