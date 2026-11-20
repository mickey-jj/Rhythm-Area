import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Empty, PageTitle, StatGrid } from "../../components/ui";
import { TeamCenter } from "../../features/events/TeamCenter";
import { ParticipationStatus } from "./components/ParticipationStatus";
import { SubmissionHistory } from "./components/SubmissionHistory";
import { ProfileSidebar } from "./components/ProfileSidebar";
import { useMyPage } from "./hooks/useMyPage";
export function MyPage() {
  const page = useMyPage();
  const { session, instance, event, attempts, records } = page;
  if (!session) return <><PageTitle eyebrow="MY AREA" title="我的参赛中心" /><Empty title="登录后查看参赛记录" description="报名状态、成绩审核和比赛记录会集中显示在这里。"><Link to="/auth?returnTo=/me" className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)]">登录 / 注册<ArrowRight size={16} /></Link></Empty></>;
  const ready = { ...page, session };
  return <div className="space-y-6"><PageTitle eyebrow="MY AREA" title={`你好，${session.user.displayName}`} description={event?.name ?? "赛事尚未发布"} />
    <StatGrid items={[{ label: "参赛身份", value: instance.isOwner ? "主办方" : instance.isJudge ? "裁判" : "选手" }, { label: "提交记录", value: attempts.isLoading ? "—" : records.length }, { label: "已审核通过", value: records.filter(attempt => attempt.status === "approved").length }, { label: "成绩待审核", value: records.filter(attempt => attempt.status === "pending").length }]} />
    {event && <TeamCenter event={event} />}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
      <div className="space-y-6"><ParticipationStatus page={ready} /><SubmissionHistory page={ready} /></div>
      <ProfileSidebar page={ready} />
    </div>
  </div>;
}
