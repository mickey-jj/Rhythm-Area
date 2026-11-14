import type { EliminationRoom } from "../../domain/eliminationGroups";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEliminationGroupsByIdAPI extends APIMessage<EliminationRoom> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<EliminationRoom> { return super.send(); }
}
