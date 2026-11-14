import { ArrowUp, ArrowDown, Check } from "lucide-react";
import { Panel, SectionHeading } from "../../../components/ui";
import { actionButton, primaryAction } from "../../../components/ui/actionStyles";
import type { EliminationPageState } from "../objects/EliminationPageState";
export function GroupFinalize({page}:{page:EliminationPageState}) {
  if(!page.room.canJudge || !page.ready)return null;
  const move=(from:number,to:number)=>page.setOrder(page.order.map((id,i)=>i===from ? page.order[to] : i===to ? page.order[from] : id));
  const complete=page.room.standings.every(r=>r.total!==null) && page.room.standings.length>0;
  const pending=page.records.some(a=>a.status==="pending");
  return <Panel><SectionHeading title="确认晋级" /><ol className="space-y-2">{page.order.map((id,i)=><li key={id} className="flex items-center gap-3 rounded-xl bg-[var(--panel2)] p-3"><span className="font-mono text-lg text-[var(--accent)]">{i+1}</span><span className="min-w-0 flex-1 break-words text-lg">{page.room.entries.find(e=>e.id===id)?.displayName}</span>{page.hasTie && <><button className={actionButton} aria-label={`上移${i+1}位`} disabled={page.busy || i===0 || page.room.standings.find(r=>r.entryId===id)?.rank!==page.room.standings.find(r=>r.entryId===page.order[i-1])?.rank} onClick={()=>move(i,i-1)}><ArrowUp size={18} /></button><button className={actionButton} aria-label={`下移${i+1}位`} disabled={page.busy || i===page.order.length-1 || page.room.standings.find(r=>r.entryId===id)?.rank!==page.room.standings.find(r=>r.entryId===page.order[i+1])?.rank} onClick={()=>move(i,i+1)}><ArrowDown size={18} /></button></>}</li>)}</ol><label className="mt-5 block text-base">{page.hasTie ? "同分判定依据 · 必填" : "赛果备注"}<textarea value={page.reason} maxLength={2000} onChange={e=>page.setReason(e.target.value)} rows={3} placeholder={page.hasTie ? "记录附加赛或抽签结果" : "可留空"} /></label><button className={`${primaryAction} mt-4`} disabled={page.busy || !complete || pending || page.hasTie && !page.reason.trim()} onClick={page.finalize}><Check size={19} />{pending ? "等待成绩审核" : `确认前 ${page.group.advance} 名晋级`}</button></Panel>;
}
