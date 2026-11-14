import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useRefresh } from "../../api/client";
import { PostMatchesByIdResetAPI } from "../../apis/events/PostMatchesByIdResetAPI";
import { PostEliminationGroupsByIdResetAPI } from "../../apis/events/PostEliminationGroupsByIdResetAPI";
import { Dialog } from "../../components/ui/Dialog";
import { ErrorBox } from "../../components/ui";
import { actionButton } from "../../components/ui/actionStyles";
import { useCurrentSession } from "../../state/session";
import type { Event } from "../../domain/types";

export function ResetMatch({event,id,version,enabled,group=false}:{event:Event;id:string;version:number;enabled:boolean;group?:boolean}){
  const session=useCurrentSession(),refresh=useRefresh();
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<unknown>(null),[reason,setReason]=useState("重新开始本场比赛");
  if(session?.user.id!==event.ownerId || event.status==="archived")return null;
  const reset=async()=>{
    setBusy(true);setError(null);
    const input={expectedVersion:version,reason:reason.trim()};
    await (group?new PostEliminationGroupsByIdResetAPI(id,input):new PostMatchesByIdResetAPI(id,input)).send().then(async()=>{await refresh();setOpen(false);},setError).finally(()=>setBusy(false));
  };
  return <><button type="button" disabled={!enabled} title={enabled?"重新开始本场比赛":"仅可重置双方已就位的当前场次"} className={actionButton} onClick={()=>{setError(null);setOpen(true);}}><RotateCcw size={17}/>重置比赛</button>{open&&<Dialog title="重置本场比赛" close={()=>{if(!busy)setOpen(false);}} actions={<><button type="button" disabled={busy} className={actionButton} onClick={()=>setOpen(false)}>取消</button><button type="button" disabled={busy||!reason.trim()} onClick={()=>void reset()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--danger)] px-5 py-3 text-base font-semibold text-white"><RotateCcw size={17}/>{busy?"重置中…":"确认重置本场"}</button></>}><p className="text-base leading-relaxed">本场回到等待开赛，选禁、阵容、交分和计时重新开始。旧记录保留。后续比赛已开始时，须先处理后续场次。</p><label>重置原因<textarea maxLength={1990} value={reason} onChange={ev=>setReason(ev.target.value)} disabled={busy}/></label>{error!=null&&<ErrorBox error={error}/>}</Dialog>}</>;
}
