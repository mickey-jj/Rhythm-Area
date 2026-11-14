import type { RulePanelProps } from "../objects/RulePanel";
import { StagesSettings } from "./StagesSettings";
export function ScheduleSettings(props: RulePanelProps) {
  return <section><h3 className="mb-5 text-lg">阶段与晋级</h3><StagesSettings {...props} /></section>;
}
