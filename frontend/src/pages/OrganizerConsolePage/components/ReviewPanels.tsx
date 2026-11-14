import { ReviewCard } from "../../../features/reviews/ReviewCard";
import { EvidenceReadAPI } from "../../../apis/events/EvidenceReadAPI";
import { Empty } from "../../../components/ui";
import type { Attempt,Audit,Entry } from "../../../domain/types";
export function EntryReviews({ entries }: { entries: Entry[] }) {
  return entries.length ? (
    <div>
      {entries.map((en) => (
        <ReviewCard
          key={en.id}
          id={en.id}
          name={en.displayName}
          status={en.status}
          kind="entries"
        >
          {en.reason && <p className={"muted [color:var(--muted)]"}>{en.reason}</p>}
        </ReviewCard>
      ))}
    </div>
  ) : (
    <Empty title="暂无报名记录" />
  );
}
export function ScoreReviews({
  attempts,
  userId,
}: {
  attempts: Attempt[];
  userId: string;
}) {
  return attempts.length ? (
    <div>
      {attempts.map((a) => (
        <ReviewCard
          key={a.id}
          id={a.id}
          name={`${a.displayName} · 尝试 #${a.sequence}`}
          status={a.status}
          kind="attempts"
          selfReview={a.submittedBy === userId}
        >
          <p className={"mono [font-family:'Cascadia_Code',_Consolas,_monospace] [font-variant-numeric:tabular-nums] [.table-scroll_&]:[white-space:nowrap] score-review-values [font-size:var(--type-20-22)] [color:var(--palette-bddbc5)] [margin:12px_0] [@media((max-width:_1000px))]:[font-size:var(--type-16-20)]"}>
            {a.items.map((i) => i.value).join(" / ")}
          </p>
          <p className={"muted [color:var(--muted)] preserve-lines [white-space:pre-wrap]"}>{a.evidenceNote}</p>
          {a.evidenceId && (
            <a
              className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [.panel-toolbar_&]:[font-size:var(--type-9-18)] [.panel-toolbar_&]:[padding:8px] [.builtin-strip_&]:[font-size:var(--type-8-18)] [.builtin-strip_&]:[padding:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.top-actions_>_&]:[display:none] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [@media((max-width:_540px))]:[.page-heading_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.builtin-strip_&]:[width:100%] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.wizard-bottom_>_&]:[padding:9px] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] small secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
              target="_blank"
              rel="noreferrer"
              href={new EvidenceReadAPI(a.evidenceId).url}
            >
              查看私有证据附件
            </a>
          )}
          <small className={"muted [color:var(--muted)]"}>
            {a.matchId ? "正赛成绩" : "海选成绩"} {a.reason && `· ${a.reason}`}
          </small>
        </ReviewCard>
      ))}
    </div>
  ) : (
    <Empty
      title="所有音符，静候落点"
      description="选手提交的成绩将在这里进入审核队列。"
    />
  );
}
export function AuditPanel({ logs }: { logs: Audit[] }) {
  return logs.length ? (
    <div className={"audit-list [&_.audit-row]:[align-items:flex-start]"}>
      {logs.map((l) => (
        <div key={l.id} className={"audit-row [display:flex] [gap:15px] [padding:17px_0] [border-bottom:1px_solid_var(--line)] [font-size:var(--type-10-18)] [color:var(--palette-b8cdbf)] [&_>_span:first-child]:[font:var(--type-8-18)_monospace] [&_>_span:first-child]:[color:var(--palette-6b9375)] [&_>_span:first-child]:[padding-top:3px] [&_>_div]:[flex:1] [&_b]:[font:var(--type-10-18)_monospace] [&_b]:[color:var(--palette-a2c3ac)] [&_p]:[font-size:var(--type-11-19)] [&_p]:[margin:8px_0] [&_p]:[color:var(--palette-91ad99)] [&_small]:[font-size:var(--type-8-18)] [&_small]:[color:var(--palette-587963)]"}>
          <span className={"audit-dot [width:6px] [height:6px] [border-radius:50%] [background:var(--palette-86ad8c)] [margin-top:4px]"} />
          <div>
            <b>{l.action}</b>
            <p>{l.detail}</p>
            <small>{l.at} · Asia/Shanghai</small>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Empty title="暂无操作记录" />
  );
}
