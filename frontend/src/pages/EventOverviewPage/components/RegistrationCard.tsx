import { ArrowRight, CircleUserRound } from "lucide-react";
import { Link } from "react-router-dom";
import {useLocation} from "react-router-dom";
import {useEffect,useRef} from "react";
import { Badge, ErrorBox, Panel, SectionHeading } from "../../../components/ui";
import type { Overview } from "../objects/Overview";

export function RegistrationCard({ page }: { page: Overview }) {
  const { event, session, mine, name, setName, error, busy, register } = page;
  const target=useRef<HTMLDivElement>(null),{hash}=useLocation();
  useEffect(()=>{if(hash==="#registration"&&!page.entries.isLoading)target.current?.scrollIntoView({block:"start"});},[hash,page.entries.isLoading]);
  return <div ref={target} id="registration" className="scroll-mt-24"><Panel><SectionHeading title={mine ? "我的参赛状态" : "参赛入口"} action={<CircleUserRound size={20} className="text-[var(--muted)]" />} />
    <p className="mb-4 text-[length:var(--body-size)] text-[var(--muted)]">{mine ? mine.displayName : session ? `你好，${session.user.displayName}` : "登录后报名、交分并查看参赛记录。"}</p>
    {mine ? <div className="space-y-4"><Badge status={mine.status}>{mine.status==="pending"?"报名待审核":mine.status==="accepted"?"报名已通过":mine.status==="rejected"?"报名已驳回":"已退出报名"}</Badge>{mine.status === "rejected" && mine.reason && <p className="text-[var(--danger)]">{mine.reason}</p>}<Link to="/me" className="flex items-center justify-between rounded-lg border border-[var(--line)] px-4 py-3 text-[var(--accent)]">我的参赛中心<ArrowRight size={16} /></Link></div>
      : event.rules.entryMode === "team" ? <Link to="/teams" className="flex items-center justify-between rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--on-accent)]">进入组队大厅<ArrowRight size={16} /></Link>
      : event.status === "registration" && event.entryCount < event.rules.capacity ? session ? <form className="space-y-4" onSubmit={e => { e.preventDefault(); void register(); }}><label className="block">参赛昵称<input value={name||session.user.displayName} placeholder={session.user.displayName} maxLength={50} onChange={e => setName(e.target.value)} /></label><button type="submit" disabled={busy} className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--on-accent)]">{busy ? "提交中…" : "提交报名"}</button></form> : <Link to="/auth?returnTo=/" className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--on-accent)]">登录后报名<ArrowRight size={16} /></Link>
        : <div className="flex items-center justify-between gap-2 rounded-lg bg-[var(--panel2)] p-3"><span className="text-[var(--muted)]">{event.status === "registration" ? "报名已满" : "报名已关闭"}</span><Badge status={event.status} /></div>}
    {error != null && <ErrorBox error={error} />}
  </Panel></div>;
}
