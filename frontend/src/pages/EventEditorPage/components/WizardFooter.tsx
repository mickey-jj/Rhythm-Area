import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { editorStepPosition, editorSteps, moveEditorStep } from "../functions/editorNavigation";
import type { EditorReady } from "../objects/EditorState";
export function WizardFooter({ page }: { page: EditorReady }) {
  const position=editorStepPosition(page.step,page.draft.rules.entryMode);
  const live=!!page.existing.data && page.existing.data.status!=="draft";
  function move(direction: -1 | 1) {
    const form = document.getElementById("event-definition-form");
    if (form instanceof HTMLFormElement && !form.reportValidity()) return;
    page.setStep(moveEditorStep(page.step, direction, page.draft.rules.entryMode));
  }
  return <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4"><button type="button" disabled={page.step === 0 || !!page.busy} onClick={() => move(-1)} className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm"><ArrowLeft size={15} />上一步</button><span className="text-xs text-[var(--muted)]">{position.current} / {position.total} · {page.dirty ? "有未保存更改" : live ? "赛制可继续修改" : "草稿可继续编辑"}</span>{page.step < editorSteps.length - 1 ? <button type="button" disabled={!!page.busy} onClick={() => move(1)} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--on-accent)]">下一步<ArrowRight size={15} /></button> : <button type="submit" name="editor-action" value={live ? "save" : "publish"} disabled={!!page.busy} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--on-accent)]"><Send size={16} />{page.busy === "publish" ? "发布中…" : live ? "保存修改" : "校验并发布"}</button>}</footer>;
}
