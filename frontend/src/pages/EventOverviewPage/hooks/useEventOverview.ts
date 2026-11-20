import { GetEventsByIdTeamsAPI } from "../../../apis/events/GetEventsByIdTeamsAPI";
import { GetEventsByIdRankingBoardAPI } from "../../../apis/events/GetEventsByIdRankingBoardAPI";
import { useInstance } from "../../../app/InstanceContext";
import { useState } from "react";
import { useApi, useRefresh } from "../../../api/client";
import { GetEventsByIdEntriesAPI } from "../../../apis/events/GetEventsByIdEntriesAPI";
import { GetEventsByIdScheduleAPI } from "../../../apis/events/GetEventsByIdScheduleAPI";
import { GetEventsByIdStagesAPI } from "../../../apis/events/GetEventsByIdStagesAPI";
import { PostEventsByIdEntriesAPI } from "../../../apis/events/PostEventsByIdEntriesAPI";
import type { Event } from "../../../domain/types";
import { useCurrentSession } from "../../../state/session";

export function useEventOverview(event: Event) {
  const session = useCurrentSession();
  const instance=useInstance();
  const entries = useApi(new GetEventsByIdEntriesAPI(event.id));
  const schedule = useApi(new GetEventsByIdScheduleAPI(event.id), true, true);
  const stages = useApi(new GetEventsByIdStagesAPI(event.id), true, true);
  const ranking=useApi(new GetEventsByIdRankingBoardAPI(event.id),event.rules.stages.some(s=>s.kind==="ranking"),3000);
  const refresh = useRefresh();
  const [name, setName] = useState(session?.user.displayName??"");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const teams = useApi(new GetEventsByIdTeamsAPI(event.id), event.rules.entryMode === "team" && !!session);
  const myTeam = teams.data?.find(team=>team.members.some(member=>member.id===session?.user.id));
  const mine = entries.data?.find(entry => entry.userId === session?.user.id || entry.id === myTeam?.entryId);
  async function register() {
    setBusy(true);
    setError(null);
    await new PostEventsByIdEntriesAPI(event.id, { displayName: name || session?.user.displayName || "" }).send()
      .then(() => refresh()).catch(setError).finally(() => setBusy(false));
  }
  return { event, session, entries, schedule, stages, mine, name, setName, error, busy, register,ranking,instance };
}
