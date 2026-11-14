import { useState } from "react";
import { useRefresh } from "../../api/client";
import { PostMatchesByIdAppealsAPI } from "../../apis/events/PostMatchesByIdAppealsAPI";
import { PostMatchesByIdReplayAPI } from "../../apis/events/PostMatchesByIdReplayAPI";
import { ErrorBox,Notice } from "../../components/ui";
import type { Event,Match } from "../../domain/types";
export function MatchOperations({
  event: e,
  match: m,
  isJudge,
  mine,
}: {
  event: Event;
  match: Match;
  isJudge: boolean;
  mine: boolean;
}) {
  const [reason, setReason] = useState("");
  const [winner, setWinner] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useRefresh();
  async function act(kind: "replay" | "appeals") {
    setBusy(true);
    setError(null);
    try {
      await (kind === "replay" ? new PostMatchesByIdReplayAPI(m.id, { reason, expectedVersion: m.version, winnerId: winner || null }) : new PostMatchesByIdAppealsAPI(m.id, { reason })).send();
      setReason("");
      setMessage(
        kind === "appeals"
          ? "申诉已提交，等待裁判处理"
          : "已保存有记录的赛务决定",
      );
      await refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if ((!isJudge && !mine) || e.status === "archived" || m.scheduleState==="historical") return null;
  return (
    <section className={"panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [.event-overview_&]:[padding:25px] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_1250px))]:[.event-overview_&]:[padding:20px] [@media((max-width:_1000px))]:[.two-column_>_aside_>_&]:[margin-bottom:0] [@media((max-width:_540px))]:[padding:20px] [@media((max-width:_540px))]:[.match-page_&]:[padding:22px_18px] [.setup-owner_&_>_svg]:[margin-bottom:23px]"}>
      <h3>申诉与异常处理</h3>
      <label>
        事实、证据链接与处理依据
        <textarea
          value={reason}
          maxLength={2000}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      {mine && (
        <button
          className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [.panel-toolbar_&]:[font-size:var(--type-9-18)] [.panel-toolbar_&]:[padding:8px] [.builtin-strip_&]:[font-size:var(--type-8-18)] [.builtin-strip_&]:[padding:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.top-actions_>_&]:[display:none] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [@media((max-width:_540px))]:[.page-heading_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.builtin-strip_&]:[width:100%] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[padding:9px] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
          disabled={busy || !reason.trim()}
          onClick={() => act("appeals")}
        >
          提交本场申诉
        </button>
      )}
      {isJudge && (
        <>
          <Notice>
            重赛保留旧成绩、选禁和阵容快照。下游已开始选禁或交分时拒绝改动；后续阶段已生成时也拒绝覆盖资格来源。改判须有明确依据，不能用它替代正常审核。
          </Notice>
          <label>
            处理方式
            <select value={winner} onChange={(e) => setWinner(e.target.value)}>
              <option value="">故障重赛：重新选禁与交分</option>
              {[m.a, m.b].filter(Boolean).map((en) => (
                <option key={en!.id} value={en!.id}>
                  有依据改判 {en!.displayName} 获胜
                </option>
              ))}
            </select>
          </label>
          <button
            className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [.panel-toolbar_&]:[font-size:var(--type-9-18)] [.panel-toolbar_&]:[padding:8px] [.builtin-strip_&]:[font-size:var(--type-8-18)] [.builtin-strip_&]:[padding:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.top-actions_>_&]:[display:none] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [@media((max-width:_540px))]:[.page-heading_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.builtin-strip_&]:[width:100%] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[padding:9px] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
            disabled={busy || !reason.trim() || !m.a || !m.b}
            onClick={() => act("replay")}
          >
            {winner ? "记录并执行改判" : "记录故障并开启重赛"}
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
      {error != null && <ErrorBox error={error} />}
    </section>
  );
}
