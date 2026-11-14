import { useState, type ReactNode } from "react";
import { isIntegerInput } from "../functions/editorRules";

export function EditorField({ label, children, wide = false }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return <label className={`block min-w-0 space-y-2 text-[length:var(--body-size)] font-medium ${wide ? "sm:col-span-2" : ""}`}><span>{label}</span>{children}</label>;
}

export function IntegerInput({ value, change, min = 0, max = 10000, label }: { value: number; change: (value: number) => void; min?: number; max?: number; label?: string }) {
  const [text, setText] = useState<string | null>(null);
  const valid = text === null || isIntegerInput(text, min, max);
  function commit() {
    if (text !== null && valid) { change(Number(text)); setText(null); }
  }
  return <span className="block"><input type="number" aria-label={label} aria-invalid={!valid} required step={1} min={min} max={max} value={text ?? value} onChange={event => setText(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commit(); } }} />{!valid && <small className="mt-1 block text-[var(--danger)]">请输入 {min}–{max} 的整数</small>}</span>;
}

export function EditorGrid({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 gap-x-5 gap-y-6 sm:grid-cols-2">{children}</div>;
}
