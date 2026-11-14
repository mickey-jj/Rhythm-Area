export const editorSteps = [
  { title: "基本信息", panel: "basic" },
  { title: "报名与资格", panel: "registration" },
  { title: "计分指标", panel: "metric" },
  { title: "赛程设置", panel: "schedule" },
  { title: "赛事图池", panel: "pool" },
  { title: "团队阵容", panel: "team" },
  { title: "赛务与权限", panel: "permissions" },
  { title: "校验与发布", panel: "publish" },
] as const;

export function initialEditorStep(value: string | null): number {
  const step = Number(value ?? 0);
  return Number.isInteger(step) && step >= 0
    ? Math.min(step, editorSteps.length - 1)
    : 0;
}

export const editorStepEnabled = (step: number, entryMode: string) =>
  editorSteps[step]?.panel !== "metric" && (editorSteps[step]?.panel !== "team" || entryMode === "team");

export function moveEditorStep(
  step: number,
  direction: -1 | 1,
  entryMode: string,
): number {
  const available = editorSteps
    .map((_, index) => index)
    .filter((index) => editorStepEnabled(index, entryMode));
  return (
    (direction === 1
      ? available.find((index) => index > step)
      : available
          .slice()
          .reverse()
          .find((index) => index < step)) ?? step
  );
}

export const visibleEditorSteps=(entryMode:string)=>editorSteps.map((item,index)=>({...item,index})).filter(item=>editorStepEnabled(item.index,entryMode));
export function editorStepPosition(step:number,entryMode:string){const visible=visibleEditorSteps(entryMode);return {current:visible.findIndex(item=>item.index===step)+1,total:visible.length};}
