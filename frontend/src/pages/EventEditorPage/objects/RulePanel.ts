import type { EventInput } from "../../../domain/types";
export type RulePanel = "basic" | "registration" | "stages" | "metric" | "draft" | "play-order" | "qualifier" | "tie" | "team" | "permissions" | "match";
export type RulePanelProps = { value: EventInput; setValue: (value: EventInput) => void; scope?: "event" | "stage" };
