import { useState } from "react";
import { PostEventsByIdEvidenceAPI } from "../../apis/events/PostEventsByIdEvidenceAPI";
import { ErrorBox } from "../../components/ui";
export function EvidenceInput({
  eventId,
  onChange,
}: {
  eventId: string;
  onChange: (id: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [name, setName] = useState("");
  return (
    <label className="block space-y-2 text-base">
      私有证据（PNG / JPEG / PDF · 5MB，可选）
      <input
        className="!block !w-full !min-w-0 !max-w-full !text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)]/10 file:px-3 file:py-2 file:text-sm file:text-[var(--accent)]"
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          onChange(null);
          setName("");
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            if (file.size > 5 * 1024 * 1024) throw new Error("文件超过 5MB");
            const data = await new PostEventsByIdEvidenceAPI(eventId, file).send();
            onChange(data.id);
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
          : name
            ? `已上传 ${name}`
            : "仅本人和对应裁判可见"}
      </small>
      {error != null && <ErrorBox error={error} />}
    </label>
  );
}
