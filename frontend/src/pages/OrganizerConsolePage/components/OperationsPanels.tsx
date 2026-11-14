import { useEffect,useState } from "react";
import { useApi,useRefresh } from "../../../api/client";
import { GetEventsByIdAppealsAPI } from "../../../apis/events/GetEventsByIdAppealsAPI";
import { GetEventsByIdAttemptsAPI } from "../../../apis/events/GetEventsByIdAttemptsAPI";
import { GetEventsByIdJudgesAPI } from "../../../apis/events/GetEventsByIdJudgesAPI";
import { GetEventsByIdRankingsAPI } from "../../../apis/events/GetEventsByIdRankingsAPI";
import { GetEventsByIdScheduleAPI } from "../../../apis/events/GetEventsByIdScheduleAPI";
import { GetMatchesByIdAPI } from "../../../apis/events/GetMatchesByIdAPI";
import { PostAppealsByIdDecisionAPI } from "../../../apis/events/PostAppealsByIdDecisionAPI";
import { PostEventsByIdJudgesAPI } from "../../../apis/events/PostEventsByIdJudgesAPI";
import { PostEventsByIdQualifierOrderAPI } from "../../../apis/events/PostEventsByIdQualifierOrderAPI";
import { ErrorBox,Notice } from "../../../components/ui";
import type { AppealDecisionKind,Attempt,Event,Match,Ranking } from "../../../domain/types";
import { useCurrentSession } from "../../../state/session";
import { ScoreReviews } from "./ReviewPanels";

type Appeal = {
  id: string;
  matchId: string;
  userId: string;
  reason: string;
  status: string;
  decision: string | null;
};
const appealActions: readonly (readonly [AppealDecisionKind, string])[] = [["uphold", "维持赛果"], ["replay", "接受并重赛"], ["reject", "驳回申诉"]];

export function AppealsPanel({ event: e }: { event: Event }) {
  const q = useApi<Appeal[]>(new GetEventsByIdAppealsAPI(e.id));
  const session = useCurrentSession();
  const refresh = useRefresh();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState<unknown>(null);
  async function decide(a: Appeal, decision: AppealDecisionKind) {
    setError(null);
    try {
      const m = await (new GetMatchesByIdAPI(a.matchId)).send();
      await (new PostAppealsByIdDecisionAPI(a.id, {
        decision,
        reason: reasons[a.id],
        expectedVersion: m.version,
      })).send();
      await refresh();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <section className={"panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [.event-overview_&]:[padding:25px] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_1250px))]:[.event-overview_&]:[padding:20px] [@media((max-width:_1000px))]:[.two-column_>_aside_>_&]:[margin-bottom:0] [@media((max-width:_540px))]:[padding:20px] [@media((max-width:_540px))]:[.match-page_&]:[padding:22px_18px] [.setup-owner_&_>_svg]:[margin-bottom:23px]"}>
      <h2>申诉处理</h2>
      {!q.data?.length && <p className={"muted [color:var(--muted)]"}>当前没有你可读取的申诉。</p>}
      {q.data?.map((a) => (
        <div className={"review-card [padding:22px_0] [border-bottom:1px_solid_var(--line)] [&:first-child]:[padding-top:0] [&:last-child]:[border-bottom:0] [&:last-child]:[padding-bottom:0] [&_h3]:[font-size:var(--type-14-20)] [&_h3]:[margin:0] [&_label]:[font-size:var(--type-10-18)] [&_label]:[margin:15px_0] [&_input]:[font-size:var(--type-11-19)] [&_>_.button-row]:[justify-content:flex-end]"} key={a.id}>
          <a href={`/matches/${a.matchId}`}>查看相关场次</a>
          <p>{a.reason}</p>
          <p>{a.decision ?? "待处理"}</p>
          {a.status === "pending" && a.userId !== session?.user.id && (
            <>
              <label>
                处理依据
                <input
                  value={reasons[a.id] ?? ""}
                  onChange={(e) =>
                    setReasons({ ...reasons, [a.id]: e.target.value })
                  }
                />
              </label>
              <div className={"button-row [display:flex] [align-items:center] [gap:9px] [flex-wrap:wrap] [@media((max-width:_1000px))]:[.console-event-heading_&]:[flex-direction:column] [@media((max-width:_540px))]:[.console-event-heading_&]:[flex-direction:row]"}>
                {appealActions.map(([key, label]) => (
                  <button
                    className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [.panel-toolbar_&]:[font-size:var(--type-9-18)] [.panel-toolbar_&]:[padding:8px] [.builtin-strip_&]:[font-size:var(--type-8-18)] [.builtin-strip_&]:[padding:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.top-actions_>_&]:[display:none] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [@media((max-width:_540px))]:[.page-heading_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.builtin-strip_&]:[width:100%] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[padding:9px] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
                    key={key}
                    disabled={!reasons[a.id]?.trim()}
                    onClick={() => decide(a, key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
      {error != null && <ErrorBox error={error} />}
    </section>
  );
}
export function JudgeAssignments({ event: e }: { event: Event }) {
  const q = useApi<{ username: string; name: string; matchId: string }[]>(new GetEventsByIdJudgesAPI(e.id));
  const matches = useApi<Match[]>(new GetEventsByIdScheduleAPI(e.id));
  const refresh = useRefresh();
  const [username, setUsername] = useState("");
  const [matchId, setMatchId] = useState("");
  const [error, setError] = useState<unknown>(null);
  async function grant(user: string, mid: string, remove: boolean) {
    setError(null);
    try {
      await (new PostEventsByIdJudgesAPI(e.id, {
        username: user,
        matchId: mid || null,
        remove,
      })).send();
      await refresh();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <section className={"panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [.event-overview_&]:[padding:25px] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_1250px))]:[.event-overview_&]:[padding:20px] [@media((max-width:_1000px))]:[.two-column_>_aside_>_&]:[margin-bottom:0] [@media((max-width:_540px))]:[padding:20px] [@media((max-width:_540px))]:[.match-page_&]:[padding:22px_18px] [.setup-owner_&_>_svg]:[margin-bottom:23px]"}>
      <h2>裁判分配</h2>
      <Notice>
        裁判须先在本实例注册。可以授权整场赛事或一个场次；指定场次裁判只能读取对应待审和私有证据。本人提交的成绩与本人的申诉始终禁止自审。
      </Notice>
      <div className={"form-grid [display:grid] [grid-template-columns:1fr_1fr] [gap:20px_17px] [&_>_.full]:[grid-column:1/-1] [&_label]:[font-size:var(--type-11-19)] [&_input]:[font-size:var(--type-12-19)] [&_select]:[font-size:var(--type-12-19)] [.attempt-form_&]:[gap:17px] [@media((max-width:_540px))]:[grid-template-columns:1fr] [@media((max-width:_540px))]:[gap:17px] [@media((max-width:_540px))]:[&_>_*]:[grid-column:1]"}>
        <label>
          裁判账号
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          授权范围
          <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
            <option value="">当前赛事全部场次与海选</option>
            {matches.data?.map((m) => (
              <option value={m.id} key={m.id}>
                {m.stageName} · {m.bracket} R{m.round} M{m.ordinal + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [.panel-toolbar_&]:[font-size:var(--type-9-18)] [.panel-toolbar_&]:[padding:8px] [.builtin-strip_&]:[font-size:var(--type-8-18)] [.builtin-strip_&]:[padding:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.top-actions_>_&]:[display:none] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [@media((max-width:_540px))]:[.page-heading_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.builtin-strip_&]:[width:100%] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[padding:9px] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
        disabled={!username.trim()}
        onClick={() => grant(username, matchId, false)}
      >
        分配裁判
      </button>
      {q.data?.map((j, i) => (
        <p key={i}>
          {j.name} · {j.matchId ? "指定场次" : "赛事全局"}{" "}
          <button
            className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [.panel-toolbar_&]:[font-size:var(--type-9-18)] [.panel-toolbar_&]:[padding:8px] [.builtin-strip_&]:[font-size:var(--type-8-18)] [.builtin-strip_&]:[padding:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.top-actions_>_&]:[display:none] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [@media((max-width:_540px))]:[.page-heading_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.builtin-strip_&]:[width:100%] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[padding:9px] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] small secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
            onClick={() => grant(j.username, j.matchId, true)}
          >
            撤销
          </button>
        </p>
      ))}
      {error != null && <ErrorBox error={error} />}
    </section>
  );
}
export function JudgeConsole({ event: e }: { event: Event }) {
  const session = useCurrentSession();
  const q = useApi<Attempt[]>(new GetEventsByIdAttemptsAPI(e.id));
  return (
    <>
      <section className={"panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [.event-overview_&]:[padding:25px] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_1250px))]:[.event-overview_&]:[padding:20px] [@media((max-width:_1000px))]:[.two-column_>_aside_>_&]:[margin-bottom:0] [@media((max-width:_540px))]:[padding:20px] [@media((max-width:_540px))]:[.match-page_&]:[padding:22px_18px] [.setup-owner_&_>_svg]:[margin-bottom:23px]"}>
        <h2>分配给我的成绩审核</h2>
        <ScoreReviews attempts={q.data ?? []} userId={session!.user.id} />
      </section>
      <AppealsPanel event={e} />
    </>
  );
}
export function QualifierOrder({ event: e }: { event: Event }) {
  const q = useApi<Ranking[]>(new GetEventsByIdRankingsAPI(e.id), e.status === "registration" &&
      e.rules.stages.some((s) => s.kind === "ranking"));
  const [order, setOrder] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<unknown>(null);
  const refresh = useRefresh();
  useEffect(() => {
    if (q.data && order.length === 0) setOrder(q.data.map((r) => r.entry.id));
  }, [q.data, order.length]);
  if (
    e.status !== "registration" ||
    !q.data?.length ||
    !q.data.every((r) => r.complete) ||
    !q.data.some((r, i, rs) => rs.findIndex((x) => x.rank === r.rank) !== i)
  )
    return null;
  return (
    <section className={"panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [.event-overview_&]:[padding:25px] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_1250px))]:[.event-overview_&]:[padding:20px] [@media((max-width:_1000px))]:[.two-column_>_aside_>_&]:[margin-bottom:0] [@media((max-width:_540px))]:[padding:20px] [@media((max-width:_540px))]:[.match-page_&]:[padding:22px_18px] [.setup-owner_&_>_svg]:[margin-bottom:23px]"}>
      <h2>资格同分：记录附加赛结果</h2>
      <Notice>
        原始海选成绩不改写。只在同分组内调整种子顺序，并填写真实附加赛结果与证据。后续若有人重新交分，旧判定自动失效。
      </Notice>
      {order.map((id, i) => {
        const row = q.data!.find((r) => r.entry.id === id);
        return (
          <div className={"button-row [display:flex] [align-items:center] [gap:9px] [flex-wrap:wrap] [@media((max-width:_1000px))]:[.console-event-heading_&]:[flex-direction:column] [@media((max-width:_540px))]:[.console-event-heading_&]:[flex-direction:row]"} key={id}>
            <span>
              {i + 1}. {row?.entry.displayName} · {row?.total}
            </span>
            <button
              className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [.panel-toolbar_&]:[font-size:var(--type-9-18)] [.panel-toolbar_&]:[padding:8px] [.builtin-strip_&]:[font-size:var(--type-8-18)] [.builtin-strip_&]:[padding:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.top-actions_>_&]:[display:none] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [@media((max-width:_540px))]:[.page-heading_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.builtin-strip_&]:[width:100%] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[padding:9px] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] small secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
              disabled={
                i === 0 ||
                row?.rank !==
                  q.data!.find((r) => r.entry.id === order[i - 1])?.rank
              }
              onClick={() => {
                const copy = [...order];
                [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                setOrder(copy);
              }}
            >
              上移
            </button>
          </div>
        );
      })}
      <label>
        资格附加赛结果、经过与证据
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={2000}
        />
      </label>
      <button
        className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [.panel-toolbar_&]:[font-size:var(--type-9-18)] [.panel-toolbar_&]:[padding:8px] [.builtin-strip_&]:[font-size:var(--type-8-18)] [.builtin-strip_&]:[padding:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.top-actions_>_&]:[display:none] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [@media((max-width:_540px))]:[.page-heading_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.builtin-strip_&]:[width:100%] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[padding:9px] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] primary [.hero-buttons_&]:[min-height:43px] [.hero-buttons_&]:[padding:12px_17px]"}
        disabled={!reason.trim()}
        onClick={async () => {
          try {
            setError(null);
            await (new PostEventsByIdQualifierOrderAPI(e.id, {
              order,
              reason,
              expectedVersion: e.version,
            })).send();
            setMessage("判定已记录，可以开启正赛。");
            await refresh();
          } catch (e) {
            setError(e);
          }
        }}
      >
        保存资格判定
      </button>
      {message && <p role="status">{message}</p>}
      {error != null && <ErrorBox error={error} />}
    </section>
  );
}
