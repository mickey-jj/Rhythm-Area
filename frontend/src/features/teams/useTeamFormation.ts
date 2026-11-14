import { useState } from "react";
import { useApi, useRefresh } from "../../api/client";
import { GetEventsByIdTeamFormationAPI } from "../../apis/events/GetEventsByIdTeamFormationAPI";
import { useInstance } from "../../app/InstanceContext";
import { useCurrentSession } from "../../state/session";
export function useTeamFormation() {
  const { event } = useInstance();
  const session = useCurrentSession();
  const query = useApi(new GetEventsByIdTeamFormationAPI(event?.id), event?.rules.entryMode === "team", true);
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const act = async (operation: () => Promise<unknown>, message: string) => {
    setBusy(true); setError(null); setSuccess("");
    await operation().then(async () => { await refresh(); setSuccess(message); }, setError).finally(() => setBusy(false));
  };
  return { event, session, query, board: query.data, owner: event?.ownerId === session?.user.id, busy, error, success, act };
}
