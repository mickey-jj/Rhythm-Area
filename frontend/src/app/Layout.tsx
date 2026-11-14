import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, AudioLines, BookOpen, CircleUserRound, Database, GitBranch, Home, Layers3, LogOut, Menu, Settings2, ShieldCheck, SlidersHorizontal, Users, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useApi, useRefresh } from "../api/client";
import { GetInstanceAPI } from "../apis/instance/GetInstanceAPI";
import { GetMeAPI } from "../apis/identity/GetMeAPI";
import { LogoutAPI } from "../apis/identity/LogoutAPI";
import { FontSizeSwitch } from "../components/FontSizeSwitch";
import { ThemeSwitch } from "../components/ThemeSwitch";
import { Badge, ErrorBox, Loading } from "../components/ui";
import type { Instance, Session } from "../domain/types";
import { setCurrentSession, useCurrentSession } from "../state/session";
import { InstanceContext } from "./InstanceContext";

export function Layout() {
  const [mobile, setMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeMenuRef = useRef<HTMLButtonElement>(null);
  const session = useCurrentSession();
  const current = useApi<Session>(new GetMeAPI());
  const instance = useApi<Instance>(new GetInstanceAPI());
  const refresh = useRefresh();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const state = instance.data;
  useEffect(() => {
    if (current.isError) setCurrentSession(null);
    else if (current.data) setCurrentSession(current.data);
  }, [current.data, current.isError]);
  useEffect(() => { void refresh(); }, [session?.user.id]);
  useEffect(() => {
    setMobile(false);
    contentRef.current?.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => document.documentElement.style.setProperty("--topbar-height", `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(update);
    observer.observe(header);
    update();
    return () => observer.disconnect();
  }, [state?.hasEvent]);
  useEffect(() => { document.title = state?.event ? `${state.event.name} · 律竞` : "律竞 · 音游赛事"; }, [state?.event?.name]);
  useEffect(() => {
    if (!mobile) return;
    closeMenuRef.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMobile(false); menuRef.current?.focus(); }
    };
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("keydown", close); menuRef.current?.focus(); };
  }, [mobile]);
  useEffect(() => {
    const media = matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (media.matches) setMobile(false); };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);
  async function logout() {
    await new LogoutAPI().send();
    queryClient.clear();
    setCurrentSession(null);
    await refresh();
    navigate("/");
  }
  if (instance.isLoading) return <Loading />;
  if (instance.error) return <ErrorBox error={instance.error} />;
  if (!state) return null;
  const nav = [
    ["/", "赛事总览", Home], ["/rules", "赛事规则", BookOpen],
    ["/participants", "参赛者", Users], ["/pool", "赛事图池", Layers3],
    ...(state.event?.rules.entryMode === "team" ? [["/teams", "组队大厅", Users] as const, ...(state.event.rules.team.formation === "draft" ? [["/team-draft", "队长选人台", ShieldCheck] as const] : [])] : []),
    ["/schedule", "赛事看板", GitBranch],
  ] as const;
  const section = location.pathname === "/manage/library" ? "曲库" : location.pathname === "/manage/pools" ? "图池工作台" : location.pathname === "/manage/config" ? "赛事配置" : location.pathname === "/manage" ? "赛务后台" : location.pathname === "/auth" ? "账号登录" : location.pathname === "/me" ? "我的参赛中心" : (location.pathname.startsWith("/schedule/")?"阶段看板":nav.find(([path]) => path === location.pathname)?.[1]) ?? (location.pathname.startsWith("/elimination-groups/") ? "败者组晋级轮" : "比赛室");
  const navClass = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-[length:var(--body-size)] transition-colors ${isActive ? "bg-[var(--accent)]/10 font-semibold text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/20" : "text-[var(--muted)] hover:bg-[var(--panel2)] hover:text-[var(--text)]"}`;
  return <InstanceContext.Provider value={state}>
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]" style={{ "--brand-color": state.appearance.accentColor } as CSSProperties}>
      <a href="#page-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-[var(--accent)] focus:p-3 focus:text-[var(--on-accent)]">跳转到页面内容</a>
      {mobile && <button aria-label="关闭菜单遮罩" onClick={() => setMobile(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" />}
      <aside id="site-navigation" aria-label="赛事导航" role={mobile ? "dialog" : undefined} aria-modal={mobile ? true : undefined} className={`fixed inset-y-0 left-0 z-[60] flex w-[280px] flex-col gap-5 overflow-hidden border-r border-[var(--line)] bg-[var(--sidebar)] px-4 py-6 transition-transform lg:visible lg:w-[244px] lg:translate-x-0 ${mobile ? "visible translate-x-0" : "invisible -translate-x-full"}`}>
        <div className="flex shrink-0 items-center justify-between px-3">
          <Link to="/" aria-label="律竞首页" className="flex shrink-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--on-accent)]"><AudioLines size={25} strokeWidth={2.5} /></span><span className="whitespace-nowrap"><b className="block text-2xl tracking-wider">律竞</b><span className="font-mono text-[length:var(--label-size)] tracking-[0.14em] text-[var(--muted)]">RHYTHM AREA</span></span></Link>
          <button ref={closeMenuRef} aria-label="关闭菜单" onClick={() => { setMobile(false); menuRef.current?.focus(); }} className="p-2 lg:hidden"><X size={20} /></button>
        </div>
        {state.event && <div className="mx-1 shrink-0 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3.5"><p className="mb-2 text-[length:var(--label-size)] text-[var(--muted)]">当前赛事</p><p className="mb-3 line-clamp-2 text-sm font-semibold leading-relaxed">{state.event.name}</p><Badge status={state.event.status} /></div>}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(state.isOwner || state.needsSetup || state.isJudge) && <div><p className="mb-3 px-4 text-[length:var(--label-size)] tracking-[0.16em] text-[var(--muted)]">赛事管理</p><nav className="space-y-1">
          {(state.isOwner || state.needsSetup) && <NavLink to="/manage/config" className={navClass}><Settings2 size={18} />赛事配置</NavLink>}
          {state.isOwner && <><NavLink to="/manage/library" className={navClass}><Database size={18} />曲库</NavLink>{state.hasEvent && <NavLink to="/manage/pools" className={navClass}><Layers3 size={18} />图池工作台</NavLink>}</>}
          {(state.isOwner || state.isJudge) && state.hasEvent && <NavLink to="/manage" end className={navClass}><SlidersHorizontal size={18} />赛务后台</NavLink>}
        </nav></div>}
        <div className={state.isOwner || state.needsSetup || state.isJudge ? "border-t border-[var(--line)] pt-4" : ""}><p className="mb-3 px-4 text-[length:var(--label-size)] tracking-[0.16em] text-[var(--muted)]">赛事空间</p><nav className="space-y-1">{(state.event ? nav : [["/", "赛事总览", Home] as const]).map(([path, label, Icon]) => <NavLink key={path} to={path} end className={navClass}><Icon size={18} className="shrink-0" />{label}</NavLink>)}</nav></div>
        <div className="border-t border-[var(--line)] pt-4"><NavLink to="/me" className={navClass}><CircleUserRound size={18} />我的参赛中心</NavLink></div>
        </div>
        <div className="shrink-0 border-t border-[var(--line)] px-4 pt-4 text-[length:var(--label-size)] text-[var(--muted)]"><div className="flex items-center gap-2"><ShieldCheck size={15} />{state.isOwner ? "主办方" : state.isJudge ? "赛事裁判" : session ? "参赛者" : "访客视角"}</div></div>
      </aside>
      <div ref={contentRef} role="region" aria-label="赛事页面" tabIndex={0} inert={mobile} className="main-shell h-dvh overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_*]:[scrollbar-width:none] [&_*::-webkit-scrollbar]:hidden focus:outline-none lg:ml-[244px] lg:w-[calc(100%_-_244px)]">
        <header ref={headerRef} className="sticky top-0 z-40 flex min-h-[76px] flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--bg)]/95 px-4 py-3 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3 text-[length:var(--body-size)]"><button ref={menuRef} onClick={() => setMobile(!mobile)} aria-label="打开菜单" aria-expanded={mobile} aria-controls="site-navigation" className="rounded-lg border border-[var(--line)] p-2 lg:hidden"><Menu size={20} /></button><Link to="/" className="flex items-center gap-1.5 font-semibold text-[var(--accent)] lg:hidden"><AudioLines size={19} />律竞</Link><span className="hidden text-[var(--muted)] lg:inline">赛事空间</span><span className="text-[var(--line)]">/</span><span className="font-medium">{section}</span></div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3"><ThemeSwitch /><FontSizeSwitch />{session ? <><Link to="/me" className="grid size-9 place-items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-sm font-semibold text-[var(--accent)]" title={session.user.displayName}>{session.user.displayName.slice(0, 1)}</Link><button aria-label="退出登录" title="退出登录" onClick={logout} className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--panel2)]"><LogOut size={17} /></button></> : <Link to="/auth" className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm hover:border-[var(--accent)]">登录<ArrowUpRight size={14} /></Link>}</div>
        </header>
        <main id="page-content" className="mx-auto min-h-[calc(100dvh_-_150px)] w-full max-w-[1560px] p-4 sm:p-8 xl:p-10"><Outlet /></main>
        <footer className="mx-4 flex flex-wrap justify-between gap-3 border-t border-[var(--line)] px-1 py-6 text-[length:var(--label-size)] text-[var(--muted)] sm:mx-8"><span>律竞 <span className="ml-2 font-mono text-[length:var(--label-size)] tracking-widest">RHYTHM AREA</span></span><span>{state.appearance.contact || "音游赛事与成绩记录"}</span></footer>
      </div>
    </div>
  </InstanceContext.Provider>;
}
