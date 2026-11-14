import {GetEliminationGroupsByIdClockAPI} from "../../../apis/events/GetEliminationGroupsByIdClockAPI";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useApi, useRefresh } from "../../../api/client";
import { GetEliminationGroupsByIdAPI } from "../../../apis/events/GetEliminationGroupsByIdAPI";
import { GetEventsByIdAttemptsAPI } from "../../../apis/events/GetEventsByIdAttemptsAPI";
import { GetEventsByIdTeamsAPI } from "../../../apis/events/GetEventsByIdTeamsAPI";
import { PostEliminationGroupsByIdFinalizeAPI } from "../../../apis/events/PostEliminationGroupsByIdFinalizeAPI";
import { useInstance } from "../../../app/InstanceContext";
import { useCurrentSession } from "../../../state/session";
export function useEliminationGroup() {
  const {groupId}=useParams();
  const {event}=useInstance();
  const session=useCurrentSession();
  const query=useApi(new GetEliminationGroupsByIdAPI(groupId),true,true);
  const attempts=useApi(new GetEventsByIdAttemptsAPI(event?.id),!!session, 2000);
  const teams=useApi(new GetEventsByIdTeamsAPI(event?.id),event?.rules.entryMode==="team" && !!session);
  const [editedOrder,setOrder]=useState<string[] | null>(null);
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<unknown>(null);
  const refresh=useRefresh();
  const room=query.data;
  const clock=useApi(new GetEliminationGroupsByIdClockAPI(groupId),!!room,2000);
  const group=room?.group;
  const myTeam=teams.data?.find(t=>t.members.some(m=>m.id===session?.user.id));
  const mine=room?.entries.find(e=>e.userId===session?.user.id);
  const ready=group?.status==="playing" && group.scheduleState==="current" && clock.data?.clock.status==="running";
  const records=(attempts.data ?? []).filter(a=>a.groupId===group?.id);
  const order=editedOrder ?? room?.standings.map(r=>r.entryId) ?? [];
  const hasTie=!!room && room.standings.flatMap(r=>r.rank ?? []).length!==new Set(room.standings.flatMap(r=>r.rank ?? [])).size;
  const finalize=async()=>{
    if(!group)return;
    setBusy(true);setError(null);
    await new PostEliminationGroupsByIdFinalizeAPI(group.id,{expectedVersion:group.version,order,reason}).send().then(()=>refresh(),setError).finally(()=>setBusy(false));
  };
  return {event,clock,session,query,attempts,room,group,myTeam,mine,ready,records,order,setOrder,reason,setReason,busy,error,hasTie,finalize};
}
