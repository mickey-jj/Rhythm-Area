import { captainNames, formationNames } from "../../domain/teamFormation";
import { BookOpen, FileCheck2, ShieldCheck } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useApi } from "../../api/client";
import { GetEventsByIdPoolAPI } from "../../apis/events/GetEventsByIdPoolAPI";
import { ErrorBox, PageTitle, Panel, SectionHeading, StatGrid } from "../../components/ui";
import type { Event } from "../../domain/types";
import { StageRules } from "./components/StageRules";

export function RulesPage() {
  const event = useOutletContext<Event>();
  const rules = event.rules;
  const pool = useApi(new GetEventsByIdPoolAPI(event.id));
  return <div className="space-y-6">
    <PageTitle eyebrow="RULEBOOK" title="赛事规则" description={event.name} action={<span className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--accent)]"><FileCheck2 size={16} />规则 v{event.ruleVersion}</span>} />
    <StatGrid items={[{ label: "比赛项目", value: rules.gameName, note: rules.clientVersion }, { label: "参赛形式", value: rules.entryMode === "team" ? "团体赛" : "个人赛", note: `最多 ${rules.capacity} 方` }, { label: "计分方式", value: rules.metric.name, note: rules.metric.higherWins ? "更高者胜" : "更低者胜" }, { label: "比赛阶段", value: rules.stages.length, note: "分阶段执行规则" }]} />
    <div className="grid items-start gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="规则目录" className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 xl:sticky xl:top-[calc(var(--topbar-height)_+_24px)]"><h2 className="mb-4 flex items-center gap-2 text-[length:var(--section-size)]"><BookOpen size={17} className="text-[var(--accent)]" />规则目录</h2><ol className="space-y-2">{rules.stages.map((stage, index) => <li key={stage.id}><a href={`#rule-${stage.id}`} className="flex gap-3 rounded-lg p-2.5 text-[length:var(--body-size)] text-[var(--muted)] hover:bg-[var(--panel2)] hover:text-[var(--accent)]"><span className="font-mono text-[var(--accent)]">{String(index + 1).padStart(2, "0")}</span>{stage.name}</a></li>)}<li><a href="#rule-review" className="flex gap-3 rounded-lg p-2.5 text-[length:var(--body-size)] text-[var(--muted)] hover:bg-[var(--panel2)]"><ShieldCheck size={16} />审核与异常</a></li></ol></nav>
      <div className="min-w-0 space-y-5">
        {rules.entryMode === "team" && <Panel><SectionHeading title="团队参赛约定" /><p className="mb-3 text-lg text-[var(--accent)]">{captainNames[rules.team.captainSelection ?? "free"]} · {formationNames[rules.team.formation ?? "free"]}</p><p className="leading-relaxed text-[var(--muted)]">每队 {rules.team.min}–{rules.team.max} 人；每曲 {rules.team.perChart} 人出场，每人最多出场 {rules.team.maxAppearances} 次。成员成绩{rules.team.aggregation === "sum" ? "求和" : "按指标精度四舍五入后取平均"}。报名后冻结成员。</p></Panel>}
        {pool.error && <ErrorBox error={pool.error} />}
        {rules.stages.map((stage, index) => <div key={stage.id} id={`rule-${stage.id}`} className="scroll-mt-[calc(var(--topbar-height)_+_24px)]"><StageRules stage={stage} rules={rules} charts={pool.data ?? []} last={index === rules.stages.length - 1} index={index} /></div>)}
        <div id="rule-review" className="scroll-mt-[calc(var(--topbar-height)_+_24px)]"><Panel><SectionHeading title="审核与异常处理" action={<ShieldCheck size={20} className="text-[var(--accent)]" />} /><div className="grid gap-4 text-[length:var(--body-size)] leading-relaxed text-[var(--muted)] sm:grid-cols-2"><div className="rounded-xl bg-[var(--panel2)] p-4"><h3 className="mb-2 text-[var(--text)]">成绩审核</h3><p>提交成绩经审核后才有效。提交者不能审核本人或本队成绩；存在待审成绩时不能结算对局。证据附件按权限读取。</p></div><div className="rounded-xl bg-[var(--panel2)] p-4"><h3 className="mb-2 text-[var(--text)]">争议与重赛</h3><p>申诉、重赛和改判保留历史及依据。下游已经实际参赛时，禁止覆盖上游结果。</p></div></div></Panel></div>
      </div>
    </div>
  </div>;
}
