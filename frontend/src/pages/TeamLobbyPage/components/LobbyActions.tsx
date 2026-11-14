import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Plus, UserPlus } from "lucide-react";
import { PostEventsByIdTeamCandidatesAPI } from "../../../apis/events/PostEventsByIdTeamCandidatesAPI";
import { PostEventsByIdCaptainsApplyAPI } from "../../../apis/events/PostEventsByIdCaptainsApplyAPI";
import { PostEventsByIdTeamsAPI } from "../../../apis/events/PostEventsByIdTeamsAPI";
import { Panel, SectionHeading } from "../../../components/ui";
import type { TeamLobbyState } from "../hooks/useTeamLobby";
import { actionButton, primaryAction } from "../../../components/ui/actionStyles";
export function LobbyActions({ page }: { page: TeamLobbyState }) {
  const [editedNote,setNote] = useState<string | null>(null);
  const [name,setName] = useState("");
  const e = page.event!;
  const me = page.board?.candidates.find(c => c.user.id === page.session?.user.id);
  const note=editedNote ?? me?.note ?? "";
  const teamLimit=(e.rules.team.captainSelection ?? "free")==="free" && (e.rules.team.formation ?? "free")==="free" ? e.rules.capacity : e.rules.team.captainCount ?? Math.min(2,e.rules.capacity);
  if (e.status !== "registration" || page.board?.draft) return null;
  if (!page.session) return <Panel><Link className={primaryAction} to="/auth">登录后加入组队</Link></Panel>;
  if (page.mine) return null;
  return <Panel><SectionHeading title={me ? "我的组队意向" : "加入组队"} action={<UserPlus size={22} className="text-[var(--accent)]" />} /><div className="grid gap-5 xl:grid-cols-2"><div className="space-y-3"><label className="block text-base">选手简介 · 公开<textarea rows={2} maxLength={300} value={note} onChange={event=>setNote(event.target.value)} placeholder={me?.note || "擅长曲风、常用难度、组队意向"} /></label><div className="flex flex-wrap gap-2"><button className={primaryAction} disabled={page.busy} onClick={()=>page.act(()=>new PostEventsByIdTeamCandidatesAPI(e.id,{note}).send(),me ? "组队意向已更新" : "已加入候选名单")}>{me ? "更新简介" : "加入候选名单"}</button>{(e.rules.team.captainSelection ?? "free") === "application" && <button className={actionButton} disabled={page.busy || me?.captainStatus === "pending"} onClick={()=>page.act(()=>new PostEventsByIdCaptainsApplyAPI(e.id,{note:note || me?.note || ""}).send(),"队长申请已提交")}><Crown size={18} />{me?.captainStatus === "pending" ? "队长申请待审核" : me?.captainStatus === "rejected" ? "重新申请队长" : "申请成为队长"}</button>}</div></div>{(e.rules.team.captainSelection ?? "free") === "free" && <div className="space-y-3"><label className="block text-base">队伍名称<input value={name} maxLength={50} onChange={event=>setName(event.target.value)} placeholder="为你的队伍命名" /></label><button className={actionButton} disabled={page.busy || !name.trim() || (page.board?.teams.length ?? 0)>=teamLimit} onClick={()=>page.act(()=>new PostEventsByIdTeamsAPI(e.id,{name,code:null}).send(),"队伍已建立")}><Plus size={18} />创建队伍并担任队长</button></div>}</div></Panel>;
}
