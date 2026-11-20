import type { useRankingStage } from "./useRankingStage";
export type QualifierReady = Extract<ReturnType<typeof useRankingStage>, { status: "ready" }>;
