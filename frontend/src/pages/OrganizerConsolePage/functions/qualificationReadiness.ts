import type { Attempt,Entry,Event } from "../../../domain/types";
import type { RankingBoard } from "../../../domain/ranking";

export function qualificationReadiness(event:Event,entries:readonly Entry[],attempts:readonly Attempt[],board:RankingBoard|undefined){
 const accepted=entries.filter(e=>e.status==="accepted").length;
 const pending=attempts.filter(a=>a.status==="pending").length;
 const qualifier=event.rules.stages.find(s=>s.kind==="ranking");
 const complete=board?.rankings.filter(r=>r.complete).length??0;
 const needed=Math.min(qualifier?.advance??2,accepted);
 return [
  ...(accepted<2?[{message:`已通过报名 ${accepted} 方，至少需要 2 方`,tab:"entries" as const}]:[]),
  ...(pending?[{message:`还有 ${pending} 份成绩待审核`,tab:"scores" as const}]:[]),
  ...(qualifier&&!board?[{message:"正在加载排名赛状态",tab:"schedule" as const}]:[]),
  ...(qualifier&&board&&board.session.status!=="closed"&&!(board.session.policy.endMode==="manual"&&complete===accepted)?[{message:"先停止排名赛收分，或等待配置的截止条件满足",tab:"schedule" as const}]:[]),
  ...(qualifier&&complete<needed?[{message:`完整有效成绩 ${complete} 方，需 ${needed} 方；可重新开放收分补齐`,tab:"schedule" as const}]:[]),
 ];
}
