import { useState } from "react";
import { useTeamFormation } from "../../../features/teams/useTeamFormation";
import { PostEventsByIdTeamDraftPickAPI } from "../../../apis/events/PostEventsByIdTeamDraftPickAPI";
export function useTeamDraft() {
  const data=useTeamFormation();
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState<"joined"|"name">("joined");
  const [page,setPage]=useState(1);
  const active=data.board?.teams.find(t=>t.id===data.board?.draft?.activeTeamId);
  const available=(data.board?.candidates ?? []).filter(c=>!c.teamId && [c.user.displayName,c.note,c.user.username].join(" ").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const candidates=sort==="name" ? available.toSorted((a,b)=>a.user.displayName.localeCompare(b.user.displayName,"zh-CN")) : available;
  const pages=Math.max(1,Math.ceil(candidates.length/6));
  const current=Math.min(page,pages);
  const canPick=data.event?.status==="registration" && data.board?.draft?.status==="drafting" && !!active && (data.owner || active.captainId===data.session?.user.id);
  const pick=(userId:string) => data.act(()=>new PostEventsByIdTeamDraftPickAPI(data.event!.id,{userId,expectedVersion:data.board!.draft!.version}).send(),"选手已加入队伍");
  return {...data, search,setSearch:(s:string)=>{setSearch(s);setPage(1);},sort,setSort,page:current,setPage,pages,active,candidates,visible:candidates.slice((current-1)*6,current*6),canPick,pick};
}
export type TeamDraftState = ReturnType<typeof useTeamDraft>;
