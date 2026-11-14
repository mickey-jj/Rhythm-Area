import type { BracketKind, RuleSet, StageKind } from "./types";
export type Stage = RuleSet["stages"][number];
export const stageNames: Record<StageKind,string> = { ranking: "排名赛 / 海选 / 刷分赛", single: "单败淘汰", double: "双败淘汰", "round-robin": "单循环" };
export const bracketNames: Record<BracketKind,string> = { winners: "胜者组", losers: "败者组", final: "总决赛", reset: "重置决赛", "round-robin": "循环赛" };
export function effectiveRules(rules: RuleSet, stage: Stage): RuleSet {
  // Qualifier scoring is event-level; match plans apply only to head-to-head stages.
  return stage.kind === "ranking" ? rules : { ...rules, ...stage.plan, draftMode:stage.plan?.draftMode ?? rules.draftMode ?? "open",tieBreak:stage.plan?.tieBreak ?? rules.tieBreak ?? [],timing:stage.plan?.timing ?? rules.timing };
}
export function stageDescription(stage: Stage, rules: RuleSet, last: boolean): string {
  const target = last && stage.kind === "ranking" && stage.advance > 1 ? `封榜后前 ${stage.advance} 方获得资格。` : last ? (stage.kind === "ranking" || stage.kind === "round-robin" ? "最终确定冠军；冠军并列时须先完成判定。" : "决出本场赛事冠军。") : `取前 ${stage.advance} 方进入下一阶段，晋级线并列须先完成附加赛判定。`;
  switch(stage.kind) {
    case "ranking": return `按完整、已审核成绩排名，不生成对战胜负。${target}`;
    case "single": return `一场失利即淘汰，轮空直接晋级且不产生比分。${target}`;
    case "double": return `胜者组首次失利转入败者组，败者组再失利即淘汰。${doubleFinalPolicy(effectiveRules(rules,stage).resolution.finalPolicy)}${target}`;
    case "round-robin": return `每两方交手一次，参赛方数为奇数时每轮有一方轮休；按胜场、再按负场排序，不使用积分制。${target}`;
  }
}
export function doubleFinalPolicy(policy: RuleSet["resolution"]["finalPolicy"]): string {
  switch(policy) {
    case "reset": return "总决赛采用重置：败者组冠军先赢一场后双方各一败，再进行重置决赛；胜者组冠军先赢则直接夺冠。";
    case "advantage": return "总决赛采用一曲胜优势：胜者组冠军带 1 个曲胜进入先胜决赛，不再额外重置。";
    case "normal": return "总决赛采用单场变体：一场定冠军，不重置；胜者组冠军也可能在首次失利时出局。";
  }
}
export function roundLabel(bracket: BracketKind, round: number, kind?: StageKind): string {
  if (kind === "single" && bracket === "winners") return `第 ${round} 轮`;
  return bracket === "final" || bracket === "reset" ? bracketNames[bracket] : `${bracketNames[bracket]} · 第 ${round} 轮`;
}
