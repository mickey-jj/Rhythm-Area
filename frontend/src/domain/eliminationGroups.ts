import type { Chart, Entry, RuleSet } from "./types";
export type EliminationGroup = { id: string; eventId: string; stageId: string; stageName: string; key: string; round: number; advance: number; sources: string[]; participants: string[]; expectedParticipants: number; status: "waiting" | "playing" | "completed" | "cancelled"; charts: Chart[]; rules: RuleSet; placements: string[]; version: number; scheduleState: "current" | "historical"; reason: string };
export type EliminationStanding = { entryId: string; total: string | null; rank: number | null; items: { slotId: string; value: string }[] };
export type EliminationRoom = { group: EliminationGroup; entries: Entry[]; standings: EliminationStanding[]; canJudge: boolean };
export type EliminationFinalizeInput = { expectedVersion: number; order: string[]; reason: string };
