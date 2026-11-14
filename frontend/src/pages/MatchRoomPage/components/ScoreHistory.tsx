import { Badge } from "../../../components/ui";
import type { MatchReady } from "../objects/MatchState";
export function ScoreHistory({page}:{page:MatchReady}){
 const rows=(page.attempts.data??[]).filter(a=>a.matchId===page.m.id&&a.submittedBy===page.session?.user.id).sort((a,b)=>b.sequence-a.sequence);
 if(!rows.length)return null;
 return <section className="space-y-4 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6"><h2>我的交分记录</h2>{rows.map(a=><article key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4"><div className="min-w-0"><p className="text-base font-medium">提交 #{a.sequence} · {a.items.map(i=>i.value).join(" / ")}</p><p className="mt-2 break-words text-sm text-[var(--muted)]">{a.reason??"等待审核"}</p></div><Badge status={a.status}/></article>)}</section>;
}
