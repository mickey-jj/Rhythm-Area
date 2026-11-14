import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
export function Dialog({ title, close, children, actions }: { title: string; close: () => void; children: ReactNode; actions?: ReactNode }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "Tab") {
        const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]') ?? []).filter(item => item.getClientRects().length > 0);
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return createPortal(<div onMouseDown={event => { if (event.target === event.currentTarget) close(); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 text-[var(--text)] backdrop-blur-sm sm:p-6"><section ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[calc(100dvh_-_32px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-2xl"><header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-6"><h2 className="text-xl">{title}</h2><button ref={closeRef} type="button" aria-label={`关闭${title}`} onClick={close} className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--panel2)]"><X size={20} /></button></header><div className="min-h-0 space-y-5 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-5 sm:p-6">{children}</div>{actions && <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-5 py-4">{actions}</footer>}</section></div>, document.body);
}
