import {GetMatchesByIdClockAPI} from "../../../apis/events/GetMatchesByIdClockAPI";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useApi,useRefresh } from "../../../api/client";
import { GetEventsByIdAPI } from "../../../apis/events/GetEventsByIdAPI";
import { GetEventsByIdAttemptsAPI } from "../../../apis/events/GetEventsByIdAttemptsAPI";
import { GetEventsByIdPoolAPI } from "../../../apis/events/GetEventsByIdPoolAPI";
import { GetMatchesByIdAPI } from "../../../apis/events/GetMatchesByIdAPI";
import { GetMatchesByIdPermissionsAPI } from "../../../apis/events/GetMatchesByIdPermissionsAPI";
import { GetEventsByIdTeamsAPI } from "../../../apis/events/GetEventsByIdTeamsAPI";
import { PostMatchesByIdDraftActionsAPI } from "../../../apis/events/PostMatchesByIdDraftActionsAPI";
import { PostMatchesByIdFinalizeAPI } from "../../../apis/events/PostMatchesByIdFinalizeAPI";
import { PostMatchesByIdRevealAPI } from "../../../apis/events/PostMatchesByIdRevealAPI";
import type { Attempt,Chart,Event,Match } from "../../../domain/types";
import { useCurrentSession } from "../../../state/session";
export function useMatchRoom() {
  const { matchId } = useParams();
  const q = useApi<Match>(new GetMatchesByIdAPI(matchId), true, 2000);
  const m = q.data;
  const clock=useApi(new GetMatchesByIdClockAPI(matchId),!!m,2000);
  const eq = useApi<Event>(new GetEventsByIdAPI(m?.eventId), !!m);
  const pool = useApi<Chart[]>(new GetEventsByIdPoolAPI(m?.eventId, { "matchId": String(matchId) }), !!m);
  const session = useCurrentSession();
  const teams=useApi(new GetEventsByIdTeamsAPI(m?.eventId),m?.rules.entryMode==="team",2000);
  const attempts = useApi<Attempt[]>(new GetEventsByIdAttemptsAPI(m?.eventId), !!m && !!session, 2000);
  const permissions = useApi<{ judge: boolean }>(new GetMatchesByIdPermissionsAPI(matchId), !!session);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const refresh = useRefresh();
  if (q.isLoading || eq.isLoading) return { status: "loading" as const };
  if (q.error || eq.error) return { status: "error" as const, error: q.error ?? eq.error };
  if (!m || !eq.data) return { status: "empty" as const };
  const e = eq.data;
  const isOwner =
    session?.user.id === e.ownerId || permissions.data?.judge === true;
  const side =
    m.currentStep?.actor === "A"
      ? m.a
      : m.currentStep?.actor === "B"
        ? m.b
        : null;
  const clockActive=clock.data?.clock.status==="running" && (!clock.data.clock.endsAt || clock.data.clock.endsAt>clock.data.serverNow);
  const mayAct = !!session && (isOwner || side?.userId === session.user.id) && clockActive;
  const mine = [m.a, m.b].find((en) => en?.userId === session?.user.id);
  const title = (key: string) =>
    pool.data?.find((c) => c.chart_key === key)?.title ??
    (key.startsWith("mystery-") ? "未揭晓隐藏曲" : key);
  async function act(kind: "draft-actions" | "finalize" | "reveal") {
    if (!m) return;
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const res = await (kind === "draft-actions" ? new PostMatchesByIdDraftActionsAPI(m.id, { expectedVersion: m.version, chartKey: selected || null, idempotencyKey: crypto.randomUUID() }) : kind === "reveal" ? new PostMatchesByIdRevealAPI(m.id, { expectedVersion: m.version }) : new PostMatchesByIdFinalizeAPI(m.id, { expectedVersion: m.version })).send();
      setSelected("");
      setConfirm(false);
      if ("message" in res) setMessage(res.message);
      await refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return { status: "ready" as const, q, m, eq, pool, clock, clockActive, session, attempts, permissions, teams, selected, setSelected, busy, setBusy, error, setError, message, setMessage, confirm, setConfirm, refresh, e, isOwner, side, mayAct, mine, title, act };
}
