import { Send } from "lucide-react";
import { useState } from "react";
import { useRefresh } from "../../api/client";
import { PostEventsByIdAttemptsAPI } from "../../apis/events/PostEventsByIdAttemptsAPI";
import { ErrorBox } from "../../components/ui";
import type { Entry,Event,Metric } from "../../domain/types";
import { EvidenceInput } from "./EvidenceInput";
export function AttemptForm({
  event,
  entry,
  slots,
  metric,
  matchId,
  groupId,
  firstTo = false,
  initialValues={},lockedIds=[],disabled=false,
}: {
  event: Event;
  entry: Entry;
  slots: { id: string; title: string }[];
  metric: Metric;
  matchId?: string;
  groupId?: string;
  firstTo?: boolean;
  initialValues?:Record<string,string>; lockedIds?:string[];disabled?:boolean;
}) {
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [evidenceBlocked, setEvidenceBlocked] = useState(false);
  const [prefix, setPrefix] = useState(slots.length);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const refresh = useRefresh();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if(disabled||busy||evidenceBlocked)return;
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      await (new PostEventsByIdAttemptsAPI(event.id, {
        entryId: entry.id,
        matchId: matchId ?? null,
        groupId: groupId ?? null,
        items: slots
          .slice(0, firstTo ? prefix : slots.length)
          .map((s) => ({ slotId: s.id, value: values[s.id] ?? "" })),
        evidenceNote: evidence,
        evidenceId,
      })).send();
      setSuccess(true);
      setValues(initialValues);
      setEvidence("");
      await refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5 text-base [&_input]:!min-h-12 [&_input]:!text-base [&_textarea]:!text-base [&_label]:!text-base [&_small]:!text-sm">
      <fieldset disabled={disabled||busy} className="space-y-5">
      {firstTo && (
        <label>
          已演奏曲数
          <select
            value={prefix}
            onChange={(e) => setPrefix(Number(e.target.value))}
          >
            {slots.map((_, i) => (
              <option key={i} value={i + 1}>
                前 {i + 1} 曲
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="grid min-w-0 gap-4 [&_label]:min-w-0">
        {slots.slice(0, firstTo ? prefix : slots.length).map((s, i) => (
          <label key={s.id} className={"full"}>
            <span className="mb-2 flex flex-wrap items-center gap-2 break-words text-base [&>small]:ml-auto [&>small]:text-sm">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--accent)]/10 font-mono text-sm text-[var(--accent)]">{i + 1}</span>
              {s.title}
              <small>
                {metric.name} / {metric.unit}
              </small>
            </span>
            <input
              required
              readOnly={lockedIds.includes(s.id)}
              inputMode="decimal"
              value={values[s.id] ?? ""}
              placeholder={`${metric.minimum}–${metric.maximum}${metric.decimals ? ` · 最多 ${metric.decimals} 位小数` : ""}`}
              onChange={(e) => setValues({ ...values, [s.id]: e.target.value })}
            />
          </label>
        ))}
        <label className={"full"}>
          现场见证说明 / 外部证据链接（必填）
          <textarea
            required
            rows={3}
            maxLength={2000}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="例如：裁判小林现场见证；或填写可访问的成绩证据链接"
          />
        </label>
      </div>
      <p className="text-sm text-[var(--muted)]">请填写见证人及核验方式，或外部证据链接。私有附件可选，上传完成后才能提交；附件不能替代上述说明。</p>
      <EvidenceInput eventId={event.id} onChange={setEvidenceId} onBlockedChange={setEvidenceBlocked} />
      {error != null && <ErrorBox error={error} />}{" "}
      {success && (
        <div className={"notice [background:var(--palette-a3edd108)] [border:1px_solid_var(--palette-a3edd123)] [color:var(--palette-a2b9b2)] [display:flex] [gap:9px] [align-items:flex-start] [padding:12px_14px] [font-size:var(--type-11-19)] [line-height:1.9] [border-radius:6px] [margin:16px_0] [&_>_svg]:[margin-top:2px] [&.error]:[color:var(--palette-eea8ad)] [&.error]:[background:var(--palette-a6464e14)] [&.error]:[border-color:var(--palette-ab586540)] [&.success]:[color:var(--palette-a6e9c1)] [&.success]:[background:var(--palette-427b4f15)] [&.success]:[border-color:var(--palette-54966c50)] [&_p]:[margin:0] [&_p]:[font-size:var(--type-11-19)] [&:has(>_p)]:[display:block] success"}>已提交，等待主办方审核。</div>
      )}
      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--on-accent)]"
        type="submit"
        disabled={busy || evidenceBlocked || !slots.length || !evidence.trim()}
      >
        <Send size={15} />
        {busy ? "提交中…" : matchId ? "提交本曲成绩" : "提交完整尝试"}
      </button>
      </fieldset>
    </form>
  );
}
