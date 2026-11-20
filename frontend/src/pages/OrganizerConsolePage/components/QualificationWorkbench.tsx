import type { Event } from "../../../domain/types";
import { useRankingStage } from "../../../features/ranking/useRankingStage";
import { RankingClock } from "../../../features/ranking/RankingClock";
import { QualifierOrder } from "./OperationsPanels";

export function QualificationWorkbench({event}:{event:Event}){
 const page=useRankingStage(event);
 if(page.status==="empty")return null;
 return <div className="space-y-5"><RankingClock page={page} compact/><div id="qualification-order" className="scroll-mt-24"><QualifierOrder event={event}/></div><p className="text-sm text-[var(--muted)]">先收齐有效成绩，再停止收分、审核、处理同分并确认晋级。手动截止且全员已有完整成绩时，确认晋级会同时关闭收分。名单和成绩在提交前仍由服务器复核。</p></div>;
}
