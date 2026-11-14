import { useState } from "react";
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
  const [tab, setTab] = useState<ReviewTab>("entries");
  const [error, setError] = useState<unknown>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const entries = useApi<Entry[]>(new GetEventsByIdEntriesAPI(e.id));
  const scores = useApi<Attempt[]>(new GetEventsByIdAttemptsAPI(e.id));
  const audit = useApi<Audit[]>(new GetEventsByIdAuditAPI(e.id));
  const matches = useApi<Match[]>(new GetEventsByIdScheduleAPI(e.id));
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
  return { status, loadError, session, tab, setTab, error, setError, confirm, setConfirm, busy, setBusy, entries, scores, audit, matches, refresh, generate };
}
