import { FlaskConical } from "lucide-react";
import { Outlet } from "react-router-dom";
import { PreparationPage } from "../pages/PreparationPage";
import { useInstance } from "./InstanceContext";
export function EventLayout() {
  const { event } = useInstance();
  if (!event) return <PreparationPage />;
  return <div className="space-y-6">
    {event.demo && <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-[length:var(--label-size)] text-[var(--muted)]"><FlaskConical size={14} className="shrink-0 text-[var(--accent)]" />演示赛事 · 参赛者与成绩均为虚构数据</div>}
    <Outlet context={event} />
  </div>;
}
