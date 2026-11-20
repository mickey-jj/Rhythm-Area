import { useState } from "react";
import { useRefresh } from "../../../api/client";
import { PostEventsByIdQualifierOrderAPI } from "../../../apis/events/PostEventsByIdQualifierOrderAPI";
import { ErrorBox } from "../../../components/ui";
import type { QualificationDecision } from "../../../domain/ranking";
import type { Event, Ranking } from "../../../domain/types";

export function QualifierOrder({ event, rows, decision, canRecord }: {
  event: Event;
  rows: Ranking[];
  decision: QualificationDecision;
  canRecord: boolean;
}) {
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const refresh = useRefresh();
  const byId = new Map(rows.map(row => [row.entry.id, row]));
  const order = chosen ?? decision.order ?? rows.map(row => row.entry.id);

  async function save() {
    if (!canRecord || busy || !reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await new PostEventsByIdQualifierOrderAPI(event.id, {
        order,
        reason,
        expectedVersion: event.version,
        expectedSnapshotKey: decision.snapshotKey,
      }).send();
      setChosen(null);
      setReason("");
    } catch (cause) {
      setError(cause);
    } finally {
      await refresh();
      setBusy(false);
    }
  }

  return (
    <section id="qualification-order" aria-labelledby="qualification-order-title"
      tabIndex={-1} className="scroll-mt-24 space-y-4 rounded-xl border border-[var(--warning)]/40 p-4">
      <h3 id="qualification-order-title">资格同分：记录附加赛结果</h3>
      {decision.status === "resolved" && <p role="status">当前有效成绩的同分判定已记录。</p>}
      {decision.status === "stale" && <p role="status">有效成绩已变化，请按当前榜单重新记录判定。</p>}
      {canRecord ? <>
        <p className="text-sm text-[var(--muted)]">只能在同分组内调整顺序。请记录附加赛结果与核验依据。</p>
        <ol className="space-y-2">
          {order.map((id, index) => {
            const row = byId.get(id);
            return <li key={id} className="flex flex-wrap justify-between gap-3">
              <span>{index + 1}. {row?.entry.displayName} · {row?.total}</span>
              <button type="button" disabled={busy || index === 0 || row?.rank !== byId.get(order[index - 1])?.rank}
                className="rounded border border-[var(--line)] px-3 py-1"
                onClick={() => setChosen(order.map((value, at) => at === index - 1 ? id : at === index ? order[index - 1] : value))}>
                在同分组内上移
              </button>
            </li>;
          })}
        </ol>
        <label>附加赛经过与证据（必填）
          <textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={2000} disabled={busy} />
        </label>
        <button type="button" disabled={busy || !reason.trim()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[var(--on-accent)]" onClick={save}>
          {busy ? "正在保存判定…" : "保存资格判定"}
        </button>
        {error != null && <ErrorBox error={error} />}
      </> : <p>还有参赛方未完成交分。请先收齐成绩，或在收分结束后为完整成绩判定。</p>}
    </section>
  );
}
