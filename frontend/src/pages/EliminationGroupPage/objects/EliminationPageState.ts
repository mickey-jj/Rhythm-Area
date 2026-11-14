import type { useEliminationGroup } from "../hooks/useEliminationGroup";
import type { EliminationRoom } from "../../../domain/eliminationGroups";
import type { Event } from "../../../domain/types";
export type EliminationPageState = ReturnType<typeof useEliminationGroup> & {room: EliminationRoom; group: EliminationRoom["group"]; event: Event};
