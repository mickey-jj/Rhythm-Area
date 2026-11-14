import type { ChartAssignment, ChartRole } from "../../../domain/library";
import type { RuleSet } from "../../../domain/types";
import { effectiveRules } from "../../../domain/stagePresentation.ts";
export type PoolPurpose = "ranking" | "extra" | "match";
export type Disclosure = "keep" | "public" | "hidden";
export type SelectionAccess = "keep" | "all" | "referee";
export const poolTitle=(key:string):string=>({main:"比赛曲目",qualifier:"排名赛曲目",extra:"加赛曲目",mystery:"裁判曲目"})[key] ?? key;
export function poolPurpose(key:string,rules:RuleSet|undefined):PoolPurpose {
  if(key==="qualifier")return "ranking";
  if(rules?.stages.filter(s=>s.kind!=="ranking").some(s=>effectiveRules(rules,s).draft.some(d=>d.pool===key)))return "match";
  return rules?.stages.filter(s=>s.kind!=="ranking").some(s=>effectiveRules(rules,s).resolution.extraPool===key) || key==="extra" ? "extra" : "match";
}
export function poolStages(key:string,rules:RuleSet|undefined):string[] {
  if(!rules)return [];
  return rules.stages.filter(s=>s.kind==="ranking" ? key==="qualifier" : effectiveRules(rules,s).draft.some(d=>d.pool===key) || effectiveRules(rules,s).resolution.extraPool===key).map(s=>s.name);
}
export function defaultRoles(pool:string,rules?:RuleSet):ChartRole[] {
  if(pool==="mystery")return ["mystery","random","assign"];
  const matches=rules?.stages.filter(s=>s.kind!=="ranking");
  const extra=pool==="extra" || matches?.some(s=>{const r=effectiveRules(rules!,s);return r.resolution.tie==="extra" && r.resolution.extraPool===pool;});
  const normal=pool!=="qualifier" && (!extra || !!matches?.some(s=>effectiveRules(rules!,s).draft.some(d=>d.pool===pool)));
  return [...(normal ? ["ban","pick","random","assign"] as const : []),...(pool==="qualifier" ? ["qualifier"] as const : []),...(extra ? ["extra"] as const : [])];
}
export function configuredPools(rules:RuleSet|undefined,assignments:readonly ChartAssignment[],custom:readonly string[]):string[] {
  const referenced=rules ? rules.stages.flatMap(s=>s.kind==="ranking" ? ["qualifier"] : [...effectiveRules(rules,s).draft.map(d=>d.pool),...(effectiveRules(rules,s).resolution.tie==="extra" ? [effectiveRules(rules,s).resolution.extraPool] : [])]) : [];
  const pools=[...new Set([...referenced,...assignments.flatMap(a=>a.pools),...custom])].filter(Boolean);
  return pools.length ? pools : ["main"];
}
export function updateChartAccess(assignments:readonly ChartAssignment[],keys:readonly string[],disclosure:Disclosure,access:SelectionAccess):ChartAssignment[] {
  const selected=new Set(keys);
  return assignments.map(a=>{
    if(!selected.has(a.chartKey))return a;
    const other=a.roles.filter(r=>!["ban","pick","random","assign","mystery"].includes(r));
    const hidden=disclosure==="hidden" || disclosure==="keep" && a.roles.includes("mystery");
    const methods:ChartRole[]=hidden || access==="referee" ? ["random","assign"] : access==="all" ? ["ban","pick","random","assign"] : a.roles.filter(r=>["ban","pick","random","assign"].includes(r));
    return {...a,roles:[...new Set([...other.filter(r=>!hidden || r!=="fixed" && r!=="qualifier"),...methods,...(hidden ? ["mystery"] as const : [])])]};
  });
}
