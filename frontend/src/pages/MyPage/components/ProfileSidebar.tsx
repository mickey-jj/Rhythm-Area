import { ArrowRight, CircleUserRound, GitBranch, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Panel, SectionHeading, TextLink } from "../../../components/ui";
import type { MyPageReady } from "../objects/MyPageState";
export function ProfileSidebar({ page }: { page: MyPageReady }) {
  const { session, event, instance } = page;
  return (
<aside className="space-y-6"><Panel><div className="mb-5 grid size-14 place-items-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]"><CircleUserRound size={30} /></div><h2 className="break-words text-[length:var(--section-size)]">{session.user.displayName}</h2><p className="mb-5 mt-2 break-words font-mono text-sm text-[var(--muted)]">@{session.user.username}</p><div className="space-y-2 border-t border-[var(--line)] pt-4">{[["/schedule", "查看赛程", GitBranch], ["/qualifier", "海选与成绩", Trophy]].filter(([path]) => path !== "/qualifier" || event?.rules.stages.some(stage => stage.kind === "ranking")).map(([path, label, Icon]) => { const Glyph = Icon as typeof Trophy; return <Link key={String(path)} to={String(path)} className="flex items-center gap-3 rounded-lg p-3 text-[length:var(--body-size)] text-[var(--muted)] hover:bg-[var(--panel2)] hover:text-[var(--accent)]"><Glyph size={17} />{String(label)}<ArrowRight size={15} className="ml-auto" /></Link>; })}{(instance.isOwner || instance.isJudge) && <TextLink to="/manage">进入赛务后台</TextLink>}</div></Panel>
      {event?.rules.entryMode === "team" && <Panel><SectionHeading title="团队参赛" /><p className="text-[length:var(--body-size)] leading-relaxed text-[var(--muted)]">报名后成员冻结；正式比赛由队长设置逐曲阵容并提交成员成绩。</p></Panel>}</aside>
  );
}
