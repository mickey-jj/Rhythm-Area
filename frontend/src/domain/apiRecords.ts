import type { User } from "./types";
export type { StageRun } from "./types";
export type Team = { id: string; name: string; captainId: string; code: string | null; entryId: string | null; frozen: boolean; members: User[] };
export type Appeal = { id: string; matchId: string; userId: string; reason: string; status: string; decision: string | null };
