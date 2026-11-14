import { GetEventsByIdTeamsAPI } from "../../../apis/events/GetEventsByIdTeamsAPI";
import { useApi } from "../../../api/client";
import { GetEventsByIdAttemptsAPI } from "../../../apis/events/GetEventsByIdAttemptsAPI";
import { GetEventsByIdEntriesAPI } from "../../../apis/events/GetEventsByIdEntriesAPI";
import { useInstance } from "../../../app/InstanceContext";
import { useCurrentSession } from "../../../state/session";

export function useMyPage() {
  const session = useCurrentSession();
  const instance = useInstance();
  const event = instance.event;
  const entries = useApi(new GetEventsByIdEntriesAPI(event?.id), !!session && !!event);
  const attempts = useApi(new GetEventsByIdAttemptsAPI(event?.id), !!session && !!event);
  const teams = useApi(new GetEventsByIdTeamsAPI(event?.id), event?.rules.entryMode === "team" && !!session);
  const myTeam = teams.data?.find(team=>team.members.some(member=>member.id===session?.user.id));
  const mine = entries.data?.find(entry => entry.userId === session?.user.id || entry.id === myTeam?.entryId);
  const records = (attempts.data ?? []).filter(attempt => attempt.submittedBy === session?.user.id || attempt.entryId === mine?.id);
  return { session, instance, event, entries, attempts, mine, records };
}
