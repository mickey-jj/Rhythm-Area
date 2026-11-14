import { useState } from "react";
import { ErrorBox, Notice } from "../../../components/ui";
import { decodeEventTemplate, ruleSummary } from "../../../domain/rules";
import type { EventInput, Template } from "../../../domain/types";
import { EditorDialog } from "./EditorDialog";
import { EditorField } from "./EditorFields";
export function TemplateImport({ templates, close, apply }: { templates: Template[]; close: () => void; apply: (value: EventInput) => void }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<EventInput | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState(templates[0]?.id ?? "");
  const preset = templates.find(template => template.id === selected);
  function inspect(source: string) {
    setText(source); setPreview(null); setError(null);
    if (!templates[0]) { setError(new Error("模板列表暂不可用，请稍后重试")); return; }
    Promise.resolve().then(() => decodeEventTemplate(source, templates[0].rules)).then(setPreview).catch(problem => setError(problem instanceof SyntaxError ? new Error("JSON 格式不正确，请检查双引号、逗号和括号。") : problem));
  }
  return <EditorDialog title="导入赛事配置" close={close} actions={<><button type="button" onClick={close} className="rounded-lg border border-[var(--line)] px-4 py-2.5">取消</button><button type="button" onClick={() => inspect(text)} className="rounded-lg border border-[var(--line)] px-4 py-2.5">预检配置</button><button type="button" disabled={!preview} onClick={() => { if (preview) { apply(preview); close(); } }} className="rounded-lg bg-[var(--accent)] px-4 py-2.5 font-medium text-[var(--on-accent)]">确认载入当前草稿</button></>}>
    <Notice>先预览再确认。载入将替换编辑内容，按当前自动保存设置保存。</Notice>
    <EditorField label="选择预设"><select value={selected} onChange={event => { setSelected(event.target.value); setPreview(null); setError(null); }}>
      {templates.map(template => <option key={template.id} value={template.id}>{template.presetLabel ?? template.name}</option>)}
    </select></EditorField>
    {preset && <section className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4"><h3>{preset.presetLabel ?? preset.name}</h3><p className="text-sm leading-relaxed text-[var(--muted)]">{preset.description || "空白配置，请按需要填写比赛内容。"}</p><p className="text-sm text-[var(--muted)]">{preset.charts.length} 张谱面 · {preset.rules.stages.length} 个阶段</p><button type="button" onClick={() => inspect(JSON.stringify({ format: "rhythm-area-template", schemaVersion: 1, ...preset }, null, 2))} className="rounded-lg border border-[var(--accent)]/40 px-4 py-2.5 text-sm text-[var(--accent)]">载入预设预览</button></section>}
    <EditorField label="或上传配置 JSON" hint="最多 12 MB；"><input className="block w-full min-w-0 max-w-full text-[length:var(--label-size)] file:mr-2 file:rounded-lg file:border file:border-[var(--line)] file:bg-[var(--panel2)] file:px-3 file:py-2" type="file" accept=".json,application/json" onChange={async event => { const file = event.target.files?.[0]; if (file) { if (file.size > 12582912) { setError(new Error("文件超过 12 MB")); setPreview(null); } else await file.text().then(inspect).catch(setError); } event.target.value = ""; }} /></EditorField>
    <EditorField label="或粘贴完整配置"><textarea rows={6} value={text} className="font-mono text-xs" onChange={event => { setText(event.target.value); setPreview(null); setError(null); }} placeholder="粘贴由本项目导出的完整配置 JSON" /></EditorField>
    {error != null && <ErrorBox error={error} />}{preview && <section className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4"><h3 className="mb-2 text-[var(--accent)]">预检通过：{preview.name || "未命名赛事"}</h3><p className="mb-3 text-sm text-[var(--muted)]">{preview.rules.gameName} · {preview.charts.length} 张谱面</p><ul className="space-y-2 text-sm">{ruleSummary(preview.rules).map(line => <li key={line}>{line}</li>)}</ul></section>}
  </EditorDialog>;
}
