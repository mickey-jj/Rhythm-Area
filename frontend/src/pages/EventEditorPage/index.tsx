import { Link } from "react-router-dom";
import { useEffect, useRef, type FormEvent } from "react";
import { Empty, ErrorBox, Loading, PageTitle } from "../../components/ui";
import { DemoPeople } from "./components/DemoPeople";
import { EditorHeader } from "./components/EditorHeader";
import { EditorNavigation } from "./components/EditorNavigation";
import { EditorPanel } from "./components/EditorPanel";
import { PresetPicker } from "./components/PresetPicker";
import { RulePreview } from "./components/RulePreview";
import { SetupOwner } from "./components/SetupOwner";
import { TemplateImport } from "./components/TemplateImport";
import { VersionHistory } from "./components/VersionHistory";
import { WizardFooter } from "./components/WizardFooter";
import { useEventEditor } from "./hooks/useEventEditor";
export function EventEditorPage() {
  const page = useEventEditor();
  const workspace = useRef<HTMLDivElement>(null);
  useEffect(() => { workspace.current?.scrollIntoView({ block: "start" }); }, [page.step]);
  if (page.view.kind === "setup") return <SetupOwner />;
  if (page.view.kind === "sign-in") return <><PageTitle title="定义比赛" /><Empty title="请登录主办账号"><Link to="/auth?returnTo=/manage/config" className="rounded-lg bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)]">登录并继续</Link></Empty></>;
  if (page.view.kind === "error") return <ErrorBox error={page.view.error} />;
  if (page.view.kind === "loading") return <Loading />;
  const ready = { ...page, draft: page.view.draft };
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const button = (event.nativeEvent as SubmitEvent).submitter;
    const action = button instanceof HTMLButtonElement ? button.value : "save";
    void page.act(action === "publish" || action === "validate" || action === "simulate" ? action : "save");
  }
  return <div className="space-y-5">
    <EditorHeader page={ready} />
    {page.importingTemplate && page.templates.data && <TemplateImport templates={page.templates.data} close={() => page.setImportingTemplate(false)} apply={value => { page.edit(value); page.setStep(0); }} />}
    {!page.eventId && <PresetPicker page={ready} />}
    <div ref={workspace} className="scroll-mt-[calc(var(--topbar-height)_+_104px)] grid min-w-0 items-start gap-5 xl:grid-cols-[170px_minmax(0,1fr)_240px] 2xl:grid-cols-[190px_minmax(0,1fr)_260px]">
      <EditorNavigation step={page.step} entryMode={ready.draft.rules.entryMode} select={page.setStep} />
      <form id="event-definition-form" className="min-w-0 xl:col-start-2 xl:row-start-1" onSubmit={submit}><EditorPanel page={ready} /><WizardFooter page={ready} /></form>
      <RulePreview page={ready} />
    </div>
    {page.eventId && <VersionHistory eventId={page.eventId} draft={ready.draft} restore={page.edit} />}
    {(!page.existing.data || page.existing.data.status==="draft") && <details className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4"><summary className="text-sm text-[var(--muted)]">可选：演示人员</summary><div className="mt-4"><DemoPeople page={ready} /></div></details>}
  </div>;
}
