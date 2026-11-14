import { AlertCircle, ArrowRight, Inbox, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { statusNames } from "../../domain/types";

export function Badge({ status, children }: { status?: string; children?: ReactNode }) {
  const tone = ["running", "drafting", "playing", "registration", "accepted", "approved"].includes(status ?? "")
    ? "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]"
    : ["rejected", "withdrawn", "cancelled"].includes(status ?? "")
      ? "border-rose-400/25 bg-rose-400/10 text-[var(--danger)]"
      : ["pending", "waiting", "draft", "qualification-tie", "awaiting-reveal"].includes(status ?? "")
        ? "border-amber-400/25 bg-amber-400/10 text-[var(--warning)]"
        : "border-[var(--line)] bg-[var(--panel2)] text-[var(--muted)]";
  return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[length:var(--label-size)] font-medium leading-normal ${tone}`}>
    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
    {children ?? statusNames[status ?? ""] ?? status}
  </span>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="mb-7 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--line)] pb-6">
    <div className="min-w-0">
      {eyebrow && <p className="mb-2 font-mono text-[length:var(--label-size)] tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>}
      <h1 className="text-[length:var(--heading-size)] font-bold tracking-tight">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-[length:var(--body-size)] text-[var(--muted)]">{description}</p>}
    </div>
    {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
  </header>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function StatGrid({ items }: { items: readonly { label: string; value: ReactNode; note?: string }[] }) {
  return <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">{items.map(item => <div key={item.label} className="min-w-0 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-5 py-4">
    <dt className="text-[length:var(--label-size)] text-[var(--muted)]">{item.label}</dt>
    <dd className="mt-1.5 break-words text-[length:var(--stat-size)] font-semibold leading-tight tabular-nums">{item.value}</dd>
    {item.note && <p className="mt-2 text-[length:var(--label-size)] text-[var(--muted)]">{item.note}</p>}
  </div>)}</dl>;
}

export function Empty({ title = "这里还没有内容", description, children }: { title?: string; description?: string; children?: ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--panel)] px-5 py-12 text-center">
    <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-[var(--panel2)] text-[var(--muted)]"><Inbox size={23} /></span>
    <h3 className="text-lg font-semibold">{title}</h3>
    {description && <p className="max-w-md text-[length:var(--body-size)] text-[var(--muted)]">{description}</p>}
    {children && <div className="mt-3">{children}</div>}
  </div>;
}

export function ErrorBox({ error }: { error: unknown }) {
  return <div role="alert" className="my-4 flex items-start gap-3 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-[length:var(--body-size)] text-[var(--danger)]">
    <AlertCircle size={19} className="mt-0.5 shrink-0" /><span className="break-words">{error instanceof Error ? error.message : String(error)}</span>
  </div>;
}

export function Loading() {
  return <div role="status" className="flex min-h-52 items-center justify-center gap-3 text-[var(--muted)]"><LoaderCircle className="animate-spin" size={22} />正在载入数据…</div>;
}

export function SectionHeading({ number, title, description, action }: { number?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      {number && <span className="mt-1 font-mono text-sm text-[var(--accent)]">{number}</span>}
      <div><h2 className="text-[length:var(--section-size)] font-semibold tracking-tight">{title}</h2>{description && <p className="mt-1 text-[length:var(--label-size)] text-[var(--muted)]">{description}</p>}</div>
    </div>{action}
  </header>;
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="inline-flex items-center gap-2 text-[length:var(--body-size)] font-medium text-[var(--accent)] hover:underline" to={to}>{children}<ArrowRight size={15} /></Link>;
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="my-4 flex items-start gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3 text-[length:var(--body-size)] text-[var(--muted)]"><AlertCircle size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" /><div className="min-w-0">{children}</div></div>;
}
