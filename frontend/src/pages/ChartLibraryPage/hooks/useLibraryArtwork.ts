import { useMemo, useRef, useState } from "react";
import { PostLibraryArtworkAPI } from "../../../apis/events/PostLibraryArtworkAPI";
import { PutLibraryArtworkAPI } from "../../../apis/events/PutLibraryArtworkAPI";
import { matchArtworkFiles, normalizeArtworkUrl, validArtworkUrl } from "../../../domain/artwork";
import type { LibraryChart } from "../../../domain/library";

export function useLibraryArtwork(game:string,charts:readonly LibraryChart[],complete:(notice:string)=>Promise<void>) {
  const [mode,setMode]=useState<{kind:"single";chart:LibraryChart}|{kind:"batch"}|null>(null);
  const [url,setUrl]=useState("");
  const [files,setFiles]=useState<File[]>([]);
  const [busy,setBusy]=useState<""|"upload"|"save">("");
  const operation=useRef(false);
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState<unknown>(null);
  const matches=useMemo(()=>matchArtworkFiles(files,charts),[files,charts]);
  const songKeys=matches.filter(m=>m.songs.length===1).map(m=>m.songs[0].song_key).toSorted();
  const duplicates=new Set(songKeys.filter((key,i)=>i>0 && songKeys[i-1]===key));
  const ready=matches.filter(m=>m.songs.length===1 && !duplicates.has(m.songs[0].song_key));
  function single(chart:LibraryChart){setMode({kind:"single",chart});setUrl(chart.cover_url ?? "");setFiles([]);setError(null);}
  function batch(){setMode({kind:"batch"});setFiles([]);setError(null);setProgress(0);}
  function close(){if(!operation.current)setMode(null);}
  function chooseFiles(next:File[]){if(next.length>128){setError(new Error("每批最多 128 张曲绘"));return;}setFiles(next);setError(null);setProgress(0);}
  function check(file:File){if(!file.size || file.size>5*1024*1024)throw new Error(`${file.name}：曲绘大小须为 1 字节至 5 MB`);if(!/\.(png|jpe?g|webp)$/i.test(file.name))throw new Error(`${file.name}：请选择 PNG、JPEG 或 WebP`);}
  async function upload(file:File){if(operation.current)return;operation.current=true;setBusy("upload");setError(null);await Promise.resolve().then(()=>check(file)).then(()=>new PostLibraryArtworkAPI(file).send()).then(asset=>setUrl(asset.url)).catch(setError).finally(()=>{operation.current=false;setBusy("");});}
  async function save(){
    if(operation.current || !mode)return;
    if(mode.kind==="single" && url.trim() && !validArtworkUrl(url.trim())){setError(new Error("曲绘地址无效"));return;}
    if(mode.kind==="batch" && !ready.length)return;
    operation.current=true;setBusy("save");setError(null);
    const items=mode.kind==="single" ? Promise.resolve([{songKey:mode.chart.song_key,coverUrl:normalizeArtworkUrl(url) || null}]) : ready.reduce<Promise<{songKey:string;coverUrl:string}[]>>(async(pending,item)=>{
      const done=await pending;check(item.file);const asset=await new PostLibraryArtworkAPI(item.file).send();setProgress(done.length+1);return [...done,{songKey:item.songs[0].song_key,coverUrl:asset.url}];
    },Promise.resolve([]));
    await items.then(items=>new PutLibraryArtworkAPI({gameKey:game,items}).send()).then(async()=>{await complete("曲绘已保存");setMode(null);}).catch(setError).finally(()=>{operation.current=false;setBusy("");});
  }
  return {mode,url,setUrl,files,matches,duplicates,ready,busy,error,progress,single,batch,close,chooseFiles,upload,save};
}
