import { useState } from "react";
import { useApi,useRefresh } from "../../../api/client";
import { GetEventsByIdAppealsAPI } from "../../../apis/events/GetEventsByIdAppealsAPI";
import { GetEventsByIdAttemptsAPI } from "../../../apis/events/GetEventsByIdAttemptsAPI";

import { GetMatchesByIdAPI } from "../../../apis/events/GetMatchesByIdAPI";
import { PostAppealsByIdDecisionAPI } from "../../../apis/events/PostAppealsByIdDecisionAPI";

import { ErrorBox } from "../../../components/ui";
import type { AppealDecisionKind,Attempt,Event } from "../../../domain/types";
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
