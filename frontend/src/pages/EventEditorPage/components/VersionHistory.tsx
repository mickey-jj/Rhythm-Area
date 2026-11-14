import { useState } from "react";
import { useApi } from "../../../api/client";
import { GetEventsByIdVersionsAPI } from "../../../apis/events/GetEventsByIdVersionsAPI";
import { GetEventsByIdVersionsByVersionAPI } from "../../../apis/events/GetEventsByIdVersionsByVersionAPI";
import { ErrorBox } from "../../../components/ui";
import type { EventInput } from "../../../domain/types";
export function VersionHistory({
  eventId,
  draft,
  restore,
}: {
  eventId: string;
  draft: EventInput;
  restore: (value: EventInput) => void;
}) {
  const q = useApi<{ version: number; at: string }[]>(new GetEventsByIdVersionsAPI(eventId));
  const [previous, setPrevious] = useState<EventInput | null>(null);
  const [error, setError] = useState<unknown>(null);
  const differences = previous
    ? Object.keys(draft).filter(
        (key) =>
          JSON.stringify(draft[key as keyof EventInput]) !==
          JSON.stringify(previous[key as keyof EventInput]),
      )
    : [];
  const labels: Record<string, string> = {
    name: "赛事名称",
    tagline: "一句话介绍",
    description: "说明",
    rules: "规则",
    charts: "图池",
    appearance: "外观",
  };
  return (
    <details className={"panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_540px))]:[padding:20px]"}>
      <summary>草稿版本与恢复</summary>
      <p className={"muted [color:var(--muted)]"}>
        加载旧版后需重新保存。
      </p>
      <div className={"button-row [display:flex] [align-items:center] [gap:9px] [flex-wrap:wrap]"}>
        {q.data?.map((v) => (
          <button
            className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] small secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
            key={v.version}
            onClick={async () => {
              setError(null);
              try {
                setPrevious(
                  await (new GetEventsByIdVersionsByVersionAPI(eventId, String(v.version))).send(),
                );
              } catch (e) {
                setError(e);
              }
            }}
          >
            查看 v{v.version}
          </button>
        ))}
      </div>
      {previous && (
        <div className={"import-guide [margin:16px_0] [border:1px_solid_var(--line)] [border-radius:8px] [padding:14px] [line-height:1.8] [&_summary]:[cursor:pointer] [&_summary]:[font-weight:650] [&_code]:[overflow-wrap:anywhere]"}>
          <p>
            与当前草稿的差异：
            {differences.length
              ? differences.map((k) => labels[k] ?? k).join("、")
              : "相同"}
          </p>
          <p>
            旧版：{previous.name} · {previous.charts.length} 张谱面 ·{" "}
            {previous.rules.stages.length} 阶段
          </p>
          <details>
            <summary>查看旧版完整配置</summary>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">
              {JSON.stringify(previous, null, 2)}
            </pre>
          </details>
          <button
            className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
            onClick={() => {
              restore(previous);
              setPrevious(null);
            }}
          >
            将此版本载入编辑区
          </button>
        </div>
      )}
      {error != null && <ErrorBox error={error} />}
    </details>
  );
}
