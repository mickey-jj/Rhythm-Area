import type { RulePanel, RulePanelProps } from "../objects/RulePanel";
import { BasicSettings, RegistrationSettings, MetricSettings, QualifierSettings, TeamSettings, PermissionsSettings } from "./SettingsForms";
import { DraftSettings, MatchSettings, PlayOrderSettings, ResolutionSettings } from "./MatchSettings";
import { StagesSettings } from "./StagesSettings";
export type { RulePanel } from "../objects/RulePanel";

export function RulePanels({ panel, ...props }: RulePanelProps & { panel: RulePanel }) {
  switch (panel) {
    case "basic": return <BasicSettings {...props} />;
    case "registration": return <RegistrationSettings {...props} />;
    case "metric": return <MetricSettings {...props} />;
    case "stages": return <StagesSettings {...props} />;
    case "match": return <MatchSettings {...props} />;
    case "draft": return <DraftSettings {...props} />;
    case "play-order": return <PlayOrderSettings {...props} />;
    case "tie": return <ResolutionSettings {...props} />;
    case "qualifier": return <QualifierSettings {...props} />;
    case "team": return <TeamSettings {...props} />;
    case "permissions": return <PermissionsSettings />;
  }
}
