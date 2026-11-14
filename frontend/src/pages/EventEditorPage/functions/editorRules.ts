import { effectiveRules } from "../../../domain/stagePresentation.ts";
import { rankingPolicy } from "../../../domain/ranking.ts";
import type { EventInput, RuleSet, StagePlan, Template } from "../../../domain/types";
import { resizeStages } from "../../../domain/configuration.ts";

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
  return items.map((item, index) => index === to ? items[from]
    : from < to && index >= from && index < to ? items[index + 1]
    : from > to && index > to && index <= from ? items[index - 1] : item);
}

export function stagePlanFromRules(rules: RuleSet): StagePlan {
  return { metric: rules.metric, matchMode: rules.matchMode, winsRequired: rules.winsRequired, draft: rules.draft, playOrder: rules.playOrder, resolution: rules.resolution,draftMode:rules.draftMode ?? "open",tieBreak:rules.tieBreak ?? [],timing:rules.timing ?? {draftSeconds:60,chartSeconds:240} };
}

export function updateStage(rules: RuleSet, index: number, patch: Partial<RuleSet["stages"][number]>): RuleSet["stages"] {
  return resizeStages(rules.stages.map((stage, current) => current === index ? { ...stage, ...patch } : stage), rules.capacity);
}

export function templateDraft(template: Template, appearance: EventInput["appearance"]): EventInput {
  return { name: template.name, tagline: template.tagline ?? "", description: template.description,
    rules: independentRules(structuredClone(template.rules)), charts: structuredClone(template.charts), appearance: structuredClone(template.appearance ?? appearance) };
}

export function isIntegerInput(value: string, minimum: number, maximum: number): boolean {
  return value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= minimum && Number(value) <= maximum;
}

export function localDateInput(instant: string | null | undefined): string {
  if (!instant) return "";
  const date = new Date(instant);
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function instantFromLocal(value: string): string | null {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function independentRules(rules:RuleSet):RuleSet {
  const stages=rules.stages.map(stage=>stage.kind==="ranking" ? {...stage,plan:null,ranking:rankingPolicy(rules,stage)} : {...stage,ranking:null,plan:stagePlanFromRules(effectiveRules(rules,stage))});
  return {...rules,stages,windows:rules.windows ? {...rules.windows,qualifierClose:null} : null};
}
