import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GetEventsByIdRankingBoardAPI } from "../../../apis/events/GetEventsByIdRankingBoardAPI";
import { qualificationReadiness } from "../functions/qualificationReadiness";
import { useApi,useRefresh } from "../../../api/client";
import { GetEventsByIdAttemptsAPI } from "../../../apis/events/GetEventsByIdAttemptsAPI";
import { GetEventsByIdAuditAPI } from "../../../apis/events/GetEventsByIdAuditAPI";
import { GetEventsByIdEntriesAPI } from "../../../apis/events/GetEventsByIdEntriesAPI";
import { GetEventsByIdScheduleAPI } from "../../../apis/events/GetEventsByIdScheduleAPI";
import { PostEventsByIdGenerateAPI } from "../../../apis/events/PostEventsByIdGenerateAPI";
import type { Attempt,Audit,Entry,Event,Match } from "../../../domain/types";
import { useCurrentSession } from "../../../state/session";
import type { ReviewTab } from "../objects/ReviewTab";
export function useOrganizerReviews(e: Event) {
  const session = useCurrentSession()!;
  const [params,setParams]=useSearchParams();
  const [error, setError] = useState<unknown>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const entries = useApi<Entry[]>(new GetEventsByIdEntriesAPI(e.id));
  const scores = useApi<Attempt[]>(new GetEventsByIdAttemptsAPI(e.id));
  const audit = useApi<Audit[]>(new GetEventsByIdAuditAPI(e.id));
  const matches = useApi<Match[]>(new GetEventsByIdScheduleAPI(e.id));
  const board=useApi(new GetEventsByIdRankingBoardAPI(e.id),e.rules.stages.some(s=>s.kind==="ranking"),3000);
  const blockers=qualificationReadiness(e,entries.data??[],scores.data??[],board.data);
  const requested=params.get("tab");
  const tab:ReviewTab=requested==="entries"||requested==="scores"||requested==="schedule"||requested==="audit"?requested:scores.data?.some(a=>a.status==="pending")?"scores":"entries";
  const setTab=(value:ReviewTab)=>setParams(previous=>{const next=new URLSearchParams(previous);next.set("tab",value);return next;},{replace:true});
  const refresh = useRefresh();
  async function generate() {
    setBusy(true);
    setError(null);
    try {
      await (new PostEventsByIdGenerateAPI(e.id, {
        expectedVersion: e.version,
      })).send();
      await refresh();
      setConfirm(false);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const loadError = entries.error ?? scores.error ?? audit.error ?? matches.error;
  const status: "loading" | "error" | "empty" | "ready" = entries.isLoading || scores.isLoading ? "loading" : loadError ? "error" : entries.data?.length ? "ready" : "empty";
  return { status, loadError, session, tab, setTab, error, setError, confirm, setConfirm, busy, setBusy, entries, scores, audit, matches, refresh, generate,blockers };
}
