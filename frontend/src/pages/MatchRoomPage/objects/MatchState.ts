import type { useMatchRoom } from "../hooks/useMatchRoom";
export type MatchReady = Extract<ReturnType<typeof useMatchRoom>, { status: "ready" }>;
