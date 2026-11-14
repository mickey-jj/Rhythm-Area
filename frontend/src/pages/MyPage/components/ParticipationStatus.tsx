import { Badge, Empty, ErrorBox, Loading, Panel, SectionHeading, TextLink } from "../../../components/ui";
import type { MyPageReady } from "../objects/MyPageState";
export function ParticipationStatus({ page }: { page: MyPageReady }) {
  const { event, entries, mine, instance } = page;
  return (
<Panel><SectionHeading title="本场参赛状态" />{!event ? <Empty title="赛事尚未发布" /> : entries.isLoading ? <Loading /> : entries.error ? <ErrorBox error={entries.error} /> : mine ? <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[var(--panel2)] p-5"><div className="grid size-12 place-items-center rounded-xl bg-[var(--accent)]/10 text-xl text-[var(--accent)]">{mine.displayName.slice(0, 1)}</div><div className="min-w-0 flex-1"><h3 className="break-words">{mine.displayName}</h3><p className="mt-1 text-[length:var(--label-size)] text-[var(--muted)]">{mine.reason || (mine.status === "accepted" ? "报名已通过，请留意赛程安排" : "等待主办方审核")}</p></div><Badge status={mine.status} /></div> : <Empty title={instance.isOwner ? "你正在管理本场赛事" : "尚未报名当前赛事"}><TextLink to={instance.isOwner ? "/manage" : "/"}>{instance.isOwner ? "进入赛务后台" : "查看比赛与报名"}</TextLink></Empty>}</Panel>
  );
}
