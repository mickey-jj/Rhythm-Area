import type { Ranking, RuleSet } from "./types";
export type RankingPolicy = { startMode:"publish"|"manual"|"scheduled"; endMode:"manual"|"fixed"|"duration"|"threshold"; startAt:string|null; deadline:string|null; durationSeconds:number|null; targetCount:number|null; targetScore:string|null };
export type RankingSession = { eventId:string; stageId:string; status:"waiting"|"open"|"closed"; startedAt:number|null; endsAt:number|null; closedAt:number|null; stopReason:"manual"|"deadline"|"threshold"|"advanced"|null; version:number; policy:RankingPolicy };
export type RankingBoard = { stageId:string; stageName:string; session:RankingSession; serverNow:number; qualifiedCount:number; rankings:Ranking[]; canManage:boolean };
export type RankingControlInput = { action:"start"|"close"|"reopen"; expectedVersion:number };
export function rankingPolicy(rules:RuleSet,stage:RuleSet["stages"][number]):RankingPolicy {
  return stage.ranking ?? {startMode:"publish",endMode:rules.windows?.qualifierClose ? "fixed" : "manual",startAt:null,deadline:rules.windows?.qualifierClose ?? null,durationSeconds:null,targetCount:null,targetScore:null};
}
export function countdownParts(milliseconds:number) {
  const total=Math.max(0,Math.ceil(milliseconds/1000));
  return {days:Math.floor(total/86400),clock:[Math.floor(total/3600)%24,Math.floor(total/60)%60,total%60].map(n=>String(n).padStart(2,"0")).join(":")};
}
