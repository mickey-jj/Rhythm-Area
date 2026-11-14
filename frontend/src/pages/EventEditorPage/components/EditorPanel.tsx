import { ErrorBox } from "../../../components/ui";
import { editorStepPosition, editorSteps } from "../functions/editorNavigation";
import type { EditorReady } from "../objects/EditorState";
import { EditorField, EditorGrid } from "./EditorFields";
import { PoolEditor } from "./PoolEditor";
import { PublishReview } from "./PublishReview";
import { RulePanels } from "./RulePanels";
import { ScheduleSettings } from "./ScheduleSettings";
export function EditorPanel({ page }: { page: EditorReady }) {
  const { draft, edit, step, currentPanel, busy, error } = page;
  const position=editorStepPosition(step,draft.rules.entryMode);
  return <section className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-7"><header className="mb-6 border-b border-[var(--line)] pb-5"><p className="mb-2 font-mono text-xs tracking-widest text-[var(--accent)]">STEP {String(position.current).padStart(2, "0")} / {position.total}</p><h2 className=" text-[length:var(--section-size)]">{editorSteps[step].title}</h2></header>{error != null && <ErrorBox error={error} />}<fieldset disabled={!!busy && !["save", "autosave"].includes(busy)} className="min-w-0 space-y-7">
    {currentPanel === "pool" ? <PoolEditor page={page} />
      : currentPanel === "publish" ? <PublishReview page={page} />
      : currentPanel === "schedule" ? <ScheduleSettings value={draft} setValue={edit} />
      : <RulePanels value={draft} setValue={edit} panel={currentPanel} />}
    {currentPanel === "basic" && <section className="border-t border-[var(--line)] pt-6"><h3 className="mb-4 text-lg">赛事外观与联系信息</h3><EditorGrid><EditorField label="主题色" hint="用于赛事主视觉装饰，律竞标识保持固定。"><input type="color" className="!mt-0 h-12 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] p-1.5" value={draft.appearance?.accentColor ?? "#a3edd1"} onChange={event => edit({ ...draft, appearance: { ...(draft.appearance ?? page.instance.appearance), accentColor: event.target.value } })} /></EditorField><EditorField label="公开联系信息"><input maxLength={500} value={draft.appearance?.contact ?? ""} onChange={event => edit({ ...draft, appearance: { ...(draft.appearance ?? page.instance.appearance), contact: event.target.value } })} /></EditorField></EditorGrid></section>}
  </fieldset></section>;
}
