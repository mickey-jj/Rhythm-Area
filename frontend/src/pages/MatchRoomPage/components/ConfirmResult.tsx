import { Trophy } from "lucide-react";
import { primaryAction,actionButton } from "../../../components/ui/actionStyles";
import type { MatchReady } from "../objects/MatchState";
export function ConfirmResult({page}:{page:MatchReady}){
 const {m,busy,confirm,setConfirm,act}=page;
 return <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6"><header className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2>裁判结算</h2><span className="text-sm text-[var(--muted)]">{m.status==="finalized"?"赛果已确认":m.status==="playing"?"待确认赛果":"等待演奏与交分"}</span></header>{m.status==="playing"&&(confirm?<div className="space-y-4"><p className="text-base">确认按当前全部已审成绩结算？</p><div className="flex flex-wrap gap-3"><button className={actionButton} disabled={busy} onClick={()=>setConfirm(false)}>取消</button><button className={primaryAction} disabled={busy} onClick={()=>act("finalize")}><Trophy size={18}/>确认结算</button></div></div>:<button className={primaryAction} disabled={busy} onClick={()=>setConfirm(true)}><Trophy size={18}/>计算并确认赛果</button>)}</section>;
}
