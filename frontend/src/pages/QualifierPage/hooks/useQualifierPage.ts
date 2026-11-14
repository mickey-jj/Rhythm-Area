import { useEffect,useState } from "react";
import { GetEventsByIdRankingBoardAPI } from "../../../apis/events/GetEventsByIdRankingBoardAPI";
import { useApi } from "../../../api/client";
import { GetEventsByIdAttemptsAPI } from "../../../apis/events/GetEventsByIdAttemptsAPI";
import { GetEventsByIdEntriesAPI } from "../../../apis/events/GetEventsByIdEntriesAPI";
import { GetEventsByIdPoolAPI } from "../../../apis/events/GetEventsByIdPoolAPI";
import { GetEventsByIdStagesAPI } from "../../../apis/events/GetEventsByIdStagesAPI";
import { poolTags } from "../../../domain/configuration";
import { qualificationRows } from "../../../domain/qualification";
import type { Event } from "../../../domain/types";
import { useCurrentSession } from "../../../state/session";

export function useQualifierPage(event: Event) {
  const session = useCurrentSession();
  const qualifier = event.rules.stages.find(stage => stage.kind === "ranking");
  const charts = useApi(new GetEventsByIdPoolAPI(event.id), !!qualifier);
  const entries = useApi(new GetEventsByIdEntriesAPI(event.id), !!qualifier,3000);
  const board=useApi(new GetEventsByIdRankingBoardAPI(event.id),!!qualifier,3000);
  const ranks={data:board.data?.rankings,isLoading:board.isLoading,error:board.error};
  const [localNow,setLocalNow]=useState(Date.now);
  useEffect(()=>{const timer=setInterval(()=>setLocalNow(Date.now()),250);return()=>clearInterval(timer);},[]);
  const liveNow=board.data ? localNow+board.data.serverNow-board.dataUpdatedAt : localNow;
  const stages = useApi(new GetEventsByIdStagesAPI(event.id), !!qualifier, true);
  const attempts = useApi(new GetEventsByIdAttemptsAPI(event.id), !!session && !!qualifier);
  if (!qualifier) return { status: "empty" as const };
  const run = stages.data?.find(stage => stage.id === qualifier.id);
  const next = stages.data?.find(stage => stage.id === event.rules.stages[1]?.id);
  const rows = qualificationRows(ranks.data ?? [], run, next, qualifier.advance, event.rules.stages.length === 1);
  const songs = (charts.data ?? []).filter(chart => poolTags(chart).includes("qualifier"));
  const slots = songs.map(chart => ({ id: chart.chart_key, title: `${chart.title} · ${chart.difficulty_label}${chart.level_value !== null ? ` ${chart.level_value}` : ""}` }));
  const mine = entries.data?.find(entry => entry.userId === session?.user.id && entry.status === "accepted");
  const locked = run?.status === "completed";
  const accepting=event.status==="registration" && board.data?.session.status==="open" && (board.data.session.endsAt===null || board.data.session.endsAt>liveNow);
  const myAttempts = (attempts.data ?? []).filter(attempt => attempt.submittedBy === session?.user.id && !attempt.matchId && !attempt.groupId);
  return { status: "ready" as const, event, session, qualifier, charts, entries, board,liveNow,accepting,ranks, stages, attempts, rows, songs, slots, mine, locked, myAttempts };
}
