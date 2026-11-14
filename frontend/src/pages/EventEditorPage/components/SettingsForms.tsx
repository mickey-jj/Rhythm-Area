import { ShieldCheck, UserRound, Users } from "lucide-react";
import { patchRules } from "../../../domain/configuration";
import type { RuleSet } from "../../../domain/types";
import { instantFromLocal, localDateInput } from "../functions/editorRules";
import { selectedValue } from "../functions/selectedValue";
import type { RulePanelProps } from "../objects/RulePanel";
import { EditorField, EditorGrid, IntegerInput } from "./EditorFields";

export function BasicSettings({ value, setValue }: RulePanelProps) {
  const rules = value.rules;
  const rule = (patch: Partial<RuleSet>) => setValue({ ...value, rules: patchRules(rules, patch) });
  return <EditorGrid>
    <EditorField label="赛事名称" wide><input required maxLength={100} value={value.name} onChange={event => setValue({ ...value, name: event.target.value })} placeholder="例如：律竞 · 秋季公开赛" /></EditorField>
    <EditorField label="游戏名称"><input required value={rules.gameName} onChange={event => rule({ gameName: event.target.value })} /></EditorField>
    <EditorField label="游戏标识" hint="与图池的 game_key 一致；更换游戏后请重新检查图池。"><input required value={rules.gameKey} onChange={event => rule({ gameKey: event.target.value })} /></EditorField>
    <EditorField label="赛事客户端 / 地区版本"><input required value={rules.clientVersion} onChange={event => rule({ clientVersion: event.target.value })} /></EditorField>
    <EditorField label="一句话介绍"><input maxLength={200} value={value.tagline} onChange={event => setValue({ ...value, tagline: event.target.value })} placeholder="可留空" /></EditorField>
    <EditorField label="赛事说明" wide><textarea rows={5} value={value.description} onChange={event => setValue({ ...value, description: event.target.value })} placeholder="说明比赛内容、参赛要求和联系办法" /></EditorField>
  </EditorGrid>;
}

export function RegistrationSettings({ value, setValue }: RulePanelProps) {
  const rules = value.rules;
  const rule = (patch: Partial<RuleSet>) => setValue({ ...value, rules: patchRules(rules, patch) });
  return <div className="space-y-6"><EditorGrid>
    <EditorField label="参赛模式" hint="团队赛会开放团队阵容设置。"><select value={rules.entryMode} onChange={event => rule({ entryMode: selectedValue(["solo", "team"], event.target.value) })}><option value="solo">个人赛</option><option value="team">团队赛</option></select></EditorField>
    <EditorField label={`报名容量（${rules.entryMode === "team" ? "队" : "人"}）`} hint={rules.entryMode === "team" ? `按队伍计数，每队 ${rules.team.min}–${rules.team.max} 人。` : "按选手人数计数。"}><IntegerInput value={rules.capacity} change={capacity => rule({ capacity })} min={2} max={256} /></EditorField>
    {([['registrationOpen', '报名开始'], ['registrationClose', '报名截止']] as const).map(([key, label]) => <EditorField key={key} label={label} hint="按本机时区填写，留空表示不限。"><input type="datetime-local" value={localDateInput(rules.windows?.[key])} onChange={event => rule({ windows: { registrationOpen: rules.windows?.registrationOpen ?? null, registrationClose: rules.windows?.registrationClose ?? null, qualifierClose: rules.windows?.qualifierClose ?? null, [key]: instantFromLocal(event.target.value) } })} /></EditorField>)}
  </EditorGrid></div>;
}

export function MetricSettings({ value, setValue }: RulePanelProps) {
  const metric = value.rules.metric;
  const change = (patch: Partial<typeof metric>) => setValue({ ...value, rules: { ...value.rules, metric: { ...metric, ...patch } } });
  return <EditorGrid><EditorField label="主指标名称"><input required value={metric.name} onChange={event => change({ name: event.target.value })} /></EditorField><EditorField label="单位"><input value={metric.unit} onChange={event => change({ unit: event.target.value })} placeholder="分、% 等，可留空" /></EditorField><EditorField label="最小值"><input required inputMode="decimal" value={metric.minimum} onChange={event => change({ minimum: event.target.value })} /></EditorField><EditorField label="最大值"><input required inputMode="decimal" value={metric.maximum} onChange={event => change({ maximum: event.target.value })} /></EditorField><EditorField label="小数位数"><IntegerInput value={metric.decimals} change={decimals => change({ decimals })} min={0} max={6} /></EditorField><EditorField label="比较方向"><select value={String(metric.higherWins)} onChange={event => change({ higherWins: event.target.value === "true" })}><option value="true">数值更高者胜</option><option value="false">数值更低者胜</option></select></EditorField></EditorGrid>;
}

export function QualifierSettings({ value, setValue }: RulePanelProps) {
  const rules = value.rules;
  const rule = (patch: Partial<RuleSet>) => setValue({ ...value, rules: { ...rules, ...patch } });
  return <div className="space-y-5"><EditorGrid><EditorField label="排名赛取分方式"><select value={rules.qualifierSelection} onChange={event => rule({ qualifierSelection: selectedValue(["whole-best", "per-chart-best", "last-approved"], event.target.value) })}><option value="whole-best">完整尝试最佳，不跨次拼分</option><option value="per-chart-best">每谱最佳</option><option value="last-approved">最后一次已通过尝试</option></select></EditorField><EditorField label="有新成绩待审核时"><select value={rules.pendingPolicy} onChange={event => rule({ pendingPolicy: selectedValue(["retain", "hide"], event.target.value) })}><option value="retain">保留旧有效成绩</option><option value="hide">暂时隐藏旧成绩，驳回后恢复</option></select></EditorField></EditorGrid></div>;
}

export function TeamSettings({ value, setValue }: RulePanelProps) {
  const team = value.rules.team;
  const change = (patch: Partial<typeof team>) => setValue({ ...value, rules: { ...value.rules, team: { ...team, ...patch } } });
  return <fieldset disabled={value.rules.entryMode !== "team"} className="space-y-6"><EditorGrid>
    <EditorField label="队长认定方式"><select value={team.captainSelection ?? "free"} onChange={event=>change({captainSelection:selectedValue(["random","appointed","application","free"],event.target.value)})}><option value="random">随机抽取</option><option value="appointed">主办认定</option><option value="application">报名审核</option><option value="free">自由担任</option></select></EditorField>
    <EditorField label="组队方式"><select value={team.formation ?? "free"} onChange={event=>change({formation:selectedValue(["free","draft","random"],event.target.value)})}><option value="free">自由组队 · 组队大厅</option><option value="draft">队长轮选 · 统一选人台</option><option value="random">随机均衡组队</option></select></EditorField>
    {(team.captainSelection && team.captainSelection!=="free" || team.formation && team.formation!=="free") && <EditorField label="队长 / 队伍数量"><IntegerInput value={team.captainCount ?? Math.min(2,value.rules.capacity)} change={captainCount=>change({captainCount})} min={2} max={value.rules.capacity} /></EditorField>}
    {team.formation==="draft" && <EditorField label="轮选顺序"><select value={team.draftOrder ?? "snake"} onChange={event=>change({draftOrder:selectedValue(["snake","round-robin"],event.target.value)})}><option value="snake">蛇形轮选 · 每轮反转顺序</option><option value="round-robin">顺序轮选 · 每轮按同一顺序</option></select></EditorField>}
    <EditorField label="团队成绩聚合" wide><select value={team.aggregation} onChange={event => change({ aggregation: selectedValue(["sum", "average"], event.target.value) })}><option value="sum">固定阵容求和</option><option value="average">固定阵容平均，按指标精度四舍五入</option></select></EditorField>{([['min', '最少人数'], ['max', '最多人数'], ['perChart', '每曲上场人数'], ['maxAppearances', '每人最多出场次数']] as const).map(([key, label]) => <EditorField key={key} label={label}><IntegerInput value={team[key]} change={next => change({ [key]: next })} min={1} max={256} /></EditorField>)}</EditorGrid></fieldset>;
}

export function PermissionsSettings() {
  return <div className="space-y-4">{[{ title: "主办方 / 裁判", detail: "配置发布、报名与成绩审核、赛果确认和获授权的异常处理。", Icon: ShieldCheck }, { title: "参赛者", detail: "本人报名、轮到自己的选禁动作、本人或本队成绩提交。", Icon: UserRound }, { title: "观众", detail: "查看已发布规则、公开图池、榜单和比赛进度。", Icon: Users }].map(({ title, detail, Icon }) => <article key={title} className="flex items-start gap-4 rounded-xl border border-[var(--line)] p-4"><Icon size={21} className="mt-1 shrink-0 text-[var(--accent)]" /><div><h3 className="mb-2">{title}</h3><p className="text-sm leading-relaxed text-[var(--muted)]">{detail}</p></div></article>)}</div>;
}
