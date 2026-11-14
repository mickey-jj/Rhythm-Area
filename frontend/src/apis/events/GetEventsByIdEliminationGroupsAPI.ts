import type { EliminationGroup } from "../../domain/eliminationGroups";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdEliminationGroupsAPI extends APIMessage<EliminationGroup[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<EliminationGroup[]> { return super.send(); }
}
