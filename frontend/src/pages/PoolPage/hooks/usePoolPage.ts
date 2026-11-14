import { useState } from "react";
import { useApi } from "../../../api/client";
import { GetEventsByIdPoolAPI } from "../../../apis/events/GetEventsByIdPoolAPI";
import { poolTags } from "../../../domain/configuration";
import type { Event } from "../../../domain/types";
import { useCurrentSession } from "../../../state/session";

export function usePoolPage(event: Event) {
  const query = useApi(new GetEventsByIdPoolAPI(event.id));
  const session = useCurrentSession();
  const [search, setSearch] = useState("");
  const [pool, setPool] = useState("all");
  const [page, setPage] = useState(1);
  const tags = [...new Set(query.data?.flatMap(poolTags))];
  const poolName = (tag: string) => ({ qualifier: "海选", main: "正赛", extra: "加赛" })[tag] ?? event.rules.stages.find(stage => stage.id === tag)?.name ?? tag;
  const rows = (query.data ?? []).filter(chart => (pool === "all" || poolTags(chart).includes(pool)) && `${chart.title} ${chart.artist} ${chart.difficulty_label}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / 6));
  const currentPage = Math.min(page, pages);
  return { event, query, session, search, setSearch, pool, setPool, page, setPage, tags, poolName, rows, pages, currentPage };
}
