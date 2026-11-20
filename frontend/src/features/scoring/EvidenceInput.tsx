import { useState } from "react";
import { PostEventsByIdEvidenceAPI } from "../../apis/events/PostEventsByIdEvidenceAPI";
import { ErrorBox } from "../../components/ui";
export function EvidenceInput({
  eventId,
  onChange,
  onBlockedChange,
}: {
  eventId: string;
  onChange: (id: string | null) => void;
  onBlockedChange: (blocked: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [name, setName] = useState("");
  const [inputVersion, setInputVersion] = useState(0);
  return (
    <label className="block space-y-2 text-base">
      私有证据（PNG / JPEG / PDF · 5MB，可选）
      <input
        key={inputVersion}
        className="!block !w-full !min-w-0 !max-w-full !text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)]/10 file:px-3 file:py-2 file:text-sm file:text-[var(--accent)]"
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          onChange(null);
          setName("");
          setError(null);
          onBlockedChange(!!file);
          if (!file) return;
          setName(file.name);
          setBusy(true);
          setError(null);
          try {
            if (file.size > 5 * 1024 * 1024) throw new Error("文件超过 5MB");
            const data = await new PostEventsByIdEvidenceAPI(eventId, file).send();
            onChange(data.id);
            onBlockedChange(false);
            setName(file.name);
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      />
      <small className="!float-none !block !text-sm text-[var(--muted)]">
        {busy
          ? "证据上传中…"
          : error != null
            ? "上传未成功，请重试或移除附件后提交"
          : name
            ? `已上传 ${name}`
            : "仅本人和对应裁判可见"}
      </small>
      {error != null && <ErrorBox error={error} />}
      {name && !busy && <button type="button" onClick={() => {onChange(null);onBlockedChange(false);setName("");setError(null);setInputVersion(inputVersion+1);}}>移除附件{error != null ? "，或重新选择文件重试" : ""}</button>}
    </label>
  );
}
