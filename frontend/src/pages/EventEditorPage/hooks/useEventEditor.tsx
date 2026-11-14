import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApi, useRefresh } from "../../../api/client";
import { GetEventsByIdAPI } from "../../../apis/events/GetEventsByIdAPI";
import { GetEventsByIdPoolAPI } from "../../../apis/events/GetEventsByIdPoolAPI";
import { GetTemplatesAPI } from "../../../apis/instance/GetTemplatesAPI";
import { PostEventsByIdPublishAPI } from "../../../apis/events/PostEventsByIdPublishAPI";
import { PostEventsByIdSimulateAPI } from "../../../apis/events/PostEventsByIdSimulateAPI";
import { PostEventsByIdValidateAPI } from "../../../apis/events/PostEventsByIdValidateAPI";
import { PostInstanceEventAPI } from "../../../apis/events/PostInstanceEventAPI";
import { PutEventsByIdAPI } from "../../../apis/events/PutEventsByIdAPI";
import { useInstance } from "../../../app/InstanceContext";
import type { Chart, DraftAction, Event, EventInput, Template, Validation } from "../../../domain/types";
import { useCurrentSession } from "../../../state/session";
import { initialEditorStep, editorStepEnabled, editorSteps as steps } from "../functions/editorNavigation";
import { independentRules, templateDraft } from "../functions/editorRules";
import type { EditorOperation, EditorViewState } from "../objects/EditorState";

export function useEventEditor() {
  const instance = useInstance();
  const eventId = instance.event?.id;
  const [params, setParams] = useSearchParams();
  const session = useCurrentSession();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const templates = useApi<Template[]>(new GetTemplatesAPI(), instance.isOwner);
  const existing = useApi<Event>(new GetEventsByIdAPI(eventId), !!eventId && instance.isOwner);
  const pool = useApi<Chart[]>(new GetEventsByIdPoolAPI(eventId), !!eventId && instance.isOwner);
  const sourceKey = eventId ?? `template:${params.get("template") ?? "blank"}`;
  const loadedKey = useRef(sourceKey);
  const operation = useRef(false);
  const editRevision = useRef(0);
  const versionRef = useRef(0);
  const [draft, setDraft] = useState<EventInput | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [version, updateVersion] = useState(0);
  const requestedStep = initialEditorStep(params.get("step"));
  const step = editorStepEnabled(requestedStep, draft?.rules.entryMode ?? "solo") ? requestedStep : requestedStep === 2 ? 3 : 4;
  const currentPanel = steps[step].panel;
  const [busy, setBusy] = useState<EditorOperation>("");
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState("");
  const [autoSave, setAutoSave] = useState(true);
  const [preset, setPreset] = useState(params.get("template") ?? "blank");
  const [importingTemplate, setImportingTemplate] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [simulation, setSimulation] = useState<{ actions: DraftAction[]; playOrder: { slotId: string; chartKey: string }[]; error: { message: string } | null } | null>(null);
  const fingerprint = draft ? JSON.stringify(draft) : "";
  const dirty = fingerprint !== savedFingerprint;
  function setVersion(next: number) { versionRef.current = next; updateVersion(next); }
  function setStep(next: number) {
    setParams(current => { const nextParams = new URLSearchParams(current); nextParams.set("step", String(next)); return nextParams; }, { replace: true });
  }
  useEffect(() => {
    if (loadedKey.current === sourceKey) return;
    loadedKey.current = sourceKey;
    setDraft(null); setSavedFingerprint(""); setValidation(null); setSimulation(null); setError(null); setNotice("");
  }, [sourceKey]);
  useEffect(() => {
    if (draft) return;
    if (eventId && existing.data && pool.data) {
      const event = existing.data;
      const initial = { name: event.name, tagline: event.tagline, description: event.description, rules: independentRules(event.rules), charts: pool.data, appearance: instance.appearance };
      setDraft(initial); setSavedFingerprint(JSON.stringify(initial)); setVersion(event.version);
    } else if (!eventId && templates.data?.length) {
      const template = templates.data.find(item => item.id === (params.get("template") ?? "blank")) ?? templates.data[0];
      const initial = templateDraft(template, instance.appearance);
      setDraft(initial); setPreset(template.id); setSavedFingerprint(template.id === "blank" ? JSON.stringify(initial) : "");
    }
  }, [draft, eventId, existing.data, pool.data, templates.data, params, instance.appearance]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function edit(value: EventInput) {
    editRevision.current += 1;
    setDraft(value); setValidation(null); setSimulation(null); setError(null); setNotice("有未保存的更改");
  }
  async function save(): Promise<Event> {
    if (!draft) throw new Error("请等待配置载入");
    const snapshot = draft;
    const expectedVersion = versionRef.current;
    const event = await (eventId ? new PutEventsByIdAPI(eventId, { ...snapshot, expectedVersion }) : new PostInstanceEventAPI({ ...snapshot, expectedVersion })).send();
    loadedKey.current = event.id;
    setVersion(event.version);
    setSavedFingerprint(JSON.stringify(snapshot));
    setNotice(`已保存 v${event.version}`);
    return event;
  }
  async function act(kind: EditorOperation) {
    if (operation.current) return;
    operation.current = true;
    const startedRevision = editRevision.current;
    setBusy(kind); setError(null);
    await save().then(async event => {
      if (kind === "validate") {
        const result = await new PostEventsByIdValidateAPI(event.id).send();
        if (startedRevision === editRevision.current) setValidation(result);
      }
      if (kind === "simulate") {
        const result = await new PostEventsByIdSimulateAPI(event.id).send();
        if (startedRevision === editRevision.current) setSimulation(result);
      }
      if (kind === "publish") {
        const result = await new PostEventsByIdValidateAPI(event.id).send();
        if (startedRevision !== editRevision.current) throw new Error("校验期间配置已变更，请重新校验并发布");
        setValidation(result);
        if (!result.valid) throw new Error("请先修正下方规则校验问题");
        await new PostEventsByIdPublishAPI(event.id, { expectedVersion: event.version }).send();
        await refresh(); navigate("/");
      }
      await refresh();
    }).catch(problem => { setError(problem); if (kind === "autosave") setAutoSave(false); }).finally(() => { operation.current = false; setBusy(""); });
  }
  useEffect(() => {
    if (!autoSave || !dirty || !eventId || !draft?.name.trim() || busy || importingTemplate || existing.data?.status !== "draft") return;
    const timer = setTimeout(() => { void act("autosave"); }, 1500);
    return () => clearTimeout(timer);
  }, [autoSave, dirty, fingerprint, eventId, busy, importingTemplate, existing.data?.status]);
  async function openWorkspace(path: string) {
    if (operation.current) return;
    operation.current=true;setBusy("save");setError(null);
    await (dirty || !eventId ? save() : Promise.resolve(existing.data)).then(async()=>{await refresh();navigate(path);}).catch(setError).finally(()=>{operation.current=false;setBusy("");});
  }
  const view: EditorViewState = instance.needsSetup ? { kind: "setup" }
    : !session ? { kind: "sign-in" }
    : !instance.isOwner ? { kind: "error", error: new Error("仅本实例主办可以配置赛事") }
    : existing.error || pool.error || (!eventId && templates.error) ? { kind: "error", error: existing.error ?? pool.error ?? templates.error }
    : !draft ? { kind: "loading" }
    : { kind: "ready", draft };
  return { view, instance, eventId, params, session, navigate, refresh, templates, existing, pool, draft, setDraft, version, setVersion, step, setStep, currentPanel, busy, setBusy, error, setError, dirty, notice: dirty && !busy ? "有未保存的更改" : notice, setNotice, autoSave, setAutoSave, preset, setPreset, importingTemplate, setImportingTemplate, confirmDemo, setConfirmDemo, validation, simulation, edit, save, act, openWorkspace };
}
