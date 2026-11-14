import { useState } from "react";
import { useRefresh } from "../../../api/client";
import { PostEventsByIdStagesBySidQualificationAPI } from "../../../apis/events/PostEventsByIdStagesBySidQualificationAPI";
import { Notice, ErrorBox } from "../../../components/ui";
import type { Entry, Event, StageRun } from "../../../domain/types";
export function Qualification({
  event: e,
  run,
  entries,
}: {
  event: Event;
  run: StageRun;
  entries: Entry[];
}) {
  const [order, setOrder] = useState(
    run.placements
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((p) => p.entryId),
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>(null);
  const refresh = useRefresh();
  return (
    <div className={"import-guide [margin:16px_0] [border:1px_solid_var(--line)] [border-radius:8px] [padding:14px] [line-height:1.8] [&_summary]:[cursor:pointer] [&_summary]:[font-weight:650] [&_code]:[overflow-wrap:anywhere]"}>
      <h3>记录并列名次的附加赛结果</h3>
      <Notice>
        只可调整同名次参赛方之间的顺序。填写实际附加赛结果和证据依据后，才会确认冠军或生成下一阶段。
      </Notice>
      {order.map((id, i) => (
        <div className={"button-row [display:flex] [align-items:center] [gap:9px] [flex-wrap:wrap]"} key={id}>
          <span>
            {i + 1}. {entries.find((e) => e.id === id)?.displayName}
          </span>
          <button
            className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] small secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
            disabled={
              i === 0 ||
              run.placements.find((p) => p.entryId === order[i - 1])?.rank !==
                run.placements.find((p) => p.entryId === id)?.rank
            }
            onClick={() => {
              setOrder(order.map((value, index) => index === i ? order[i - 1] : index === i - 1 ? order[i] : value));
            }}
          >
            上移
          </button>
        </div>
      ))}
      <label>
        附加赛经过、成绩与判定依据
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <button
        className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] primary [.hero-buttons_&]:[min-height:43px] [.hero-buttons_&]:[padding:12px_17px]"}
        disabled={!reason.trim()}
        onClick={async () => {
          setError(null);
          try {
            await (new PostEventsByIdStagesBySidQualificationAPI(e.id, run.id, { order, reason, expectedVersion: e.version })).send();
            await refresh();
          } catch (err) {
            setError(err);
          }
        }}
      >
        确认并推进
      </button>
      {error != null && <ErrorBox error={error} />}
    </div>
  );
}
