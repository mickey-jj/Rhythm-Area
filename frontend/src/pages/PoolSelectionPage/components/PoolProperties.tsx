import { useState } from "react";
import { Dialog } from "../../../components/ui/Dialog";
import { ErrorBox } from "../../../components/ui";
import { actionButton, primaryAction } from "../../../components/ui/actionStyles";
import type { Disclosure, SelectionAccess } from "../functions/poolRules";
import type { PoolSelectionState } from "../objects/PoolSelectionState";
export function PoolProperties({page}:{page:PoolSelectionState}) {
  const [disclosure,setDisclosure]=useState<Disclosure>("keep");
  const [access,setAccess]=useState<SelectionAccess>("keep");
  return <Dialog title="曲目设置" close={()=>page.setProperties(false)} actions={<><button type="button" className={actionButton} onClick={()=>page.setProperties(false)}>取消</button><button type="button" className={primaryAction} disabled={page.busy || disclosure==="keep" && access==="keep"} onClick={()=>page.applyAccess(disclosure,access)}>应用到 {page.selectedAssigned.length} 张谱面</button></>}><p className="text-lg">已选图池谱面 <b className="font-mono text-[var(--accent)]">{page.selectedAssigned.length}</b> 张</p><label className="block text-base">公开方式<select value={disclosure} onChange={ev=>setDisclosure(ev.target.value as Disclosure)}><option value="keep">不更改</option><option value="public">公开曲目</option><option value="hidden">隐藏原创曲 · 由裁判揭晓</option></select></label><label className="block text-base">选曲权限<select value={access} onChange={ev=>setAccess(ev.target.value as SelectionAccess)}><option value="keep">不更改</option><option value="all">正常选禁与裁判选曲</option><option value="referee">仅裁判随机或指定</option></select></label>{page.error!=null && <ErrorBox error={page.error} />}</Dialog>;
}
