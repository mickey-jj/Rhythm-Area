import { ArrowLeft, ArrowRight, AudioLines, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useRefresh } from "../../api/client";
import { LoginAPI } from "../../apis/identity/LoginAPI";
import { RegisterAPI } from "../../apis/identity/RegisterAPI";
import { useInstance } from "../../app/InstanceContext";
import { ErrorBox, Notice } from "../../components/ui";
import { setCurrentSession, useCurrentSession } from "../../state/session";

export function AuthPage() {
  const instance = useInstance();
  const [register, setRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const session = useCurrentSession();
  const queryClient=useQueryClient();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    await (register ? new RegisterAPI({ username, password, displayName }) : new LoginAPI({ username, password })).send().then(async nextSession => {
      queryClient.clear();
      setCurrentSession(nextSession);
      await refresh();
      const next = params.get("returnTo") ?? "/me";
      navigate(next.startsWith("/") && !next.startsWith("//") && !next.includes(String.fromCharCode(92)) ? next : "/me");
    }).catch(setError).finally(() => setBusy(false));
  }
  return <div className="mx-auto max-w-5xl py-4 sm:py-10"><Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)]"><ArrowLeft size={15} />返回赛事</Link>
    <div className="grid overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)] md:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden border-b border-[var(--line)] bg-[var(--accent)]/5 p-7 md:flex md:border-b-0 md:border-r md:p-10"><div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full border-[40px] border-[var(--accent)]/5" /><div><span className="mb-6 inline-grid size-14 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--on-accent)]"><AudioLines size={30} /></span><p className="mb-3 font-mono text-[length:var(--label-size)] tracking-[0.2em] text-[var(--accent)]">RHYTHM AREA</p><h1 className="font-bold text-[length:var(--heading-size)]">你的参赛入口</h1><p className="mt-4 text-[length:var(--body-size)] leading-relaxed text-[var(--muted)]">{instance.event?.name ?? "律竞 · 音游赛事"}</p></div><ol className="relative mt-10 space-y-4 text-[length:var(--body-size)] text-[var(--muted)]">{["报名与资格审核", "选禁曲与成绩提交", "赛程与比赛记录"].map((label, index) => <li key={label} className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full border border-[var(--accent)]/25 font-mono text-xs text-[var(--accent)]">{index + 1}</span>{label}</li>)}</ol></aside>
      <section className="p-6 sm:p-10"><div role="group" aria-label="账号操作" className="mb-7 flex rounded-xl border border-[var(--line)] bg-[var(--bg)] p-1">{[[false, "登录"], [true, "创建账号"]].map(([value, label]) => <button key={String(label)} type="button" aria-pressed={register === value} disabled={value === true && !instance.published} title={value === true && !instance.published ? "赛事发布后开放选手注册" : undefined} onClick={() => { setRegister(value === true); setError(null); }} className={`flex-1 rounded-lg px-4 py-2.5 text-[length:var(--body-size)] ${register === value ? "bg-[var(--panel2)] font-medium text-[var(--accent)]" : "text-[var(--muted)]"}`}>{String(label)}</button>)}</div><h2 className=" text-[length:var(--section-size)]">{register ? "创建参赛账号" : "欢迎回来"}</h2><p className="mb-6 mt-2 text-[length:var(--body-size)] text-[var(--muted)]">{register ? "填写账号信息，开始参与本场赛事。" : "登录后继续你的比赛。"}</p>
        {session && <Notice>当前已登录 {session.user.displayName}。<Link to="/me" className="ml-2 text-[var(--accent)] underline">进入我的中心</Link></Notice>}
        <form onSubmit={submit} className="space-y-5"><label className="block">账号<input required minLength={register ? 3 : 1} maxLength={32} autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder={register ? "3–32 位英文、数字、下划线" : "输入注册账号"} /></label>{register && <label className="block">昵称<input required maxLength={50} autoComplete="nickname" value={displayName} onChange={event => setName(event.target.value)} placeholder="在赛场上显示的名字" /></label>}<label className="block">密码<span className="relative mt-2 block"><input className="!mt-0 !pr-12" type={visible ? "text" : "password"} required minLength={register ? 10 : 1} maxLength={256} autoComplete={register ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder={register ? "至少 10 位" : "输入密码"} /><button type="button" aria-label={visible ? "隐藏密码" : "显示密码"} aria-pressed={visible} onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-0 px-3 text-[var(--muted)]">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>{error != null && <ErrorBox error={error} />}<button type="submit" disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-[var(--on-accent)] hover:opacity-85">{busy ? "处理中…" : register ? "创建账号" : "登录并继续"}<ArrowRight size={17} /></button></form>
        <p className="mt-6 flex items-center justify-center gap-2 text-[length:var(--label-size)] text-[var(--muted)]"><ShieldCheck size={15} />账号用于本场赛事与成绩记录</p>{instance.needsSetup && <Notice><Link to="/manage/config" className="text-[var(--accent)]">创建主办账号</Link></Notice>}
      </section>
    </div>
  </div>;
}
