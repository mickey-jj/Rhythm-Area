import type { EliminationRoom, EliminationFinalizeInput } from "../../domain/eliminationGroups";
import { APIMessage } from "../../system/api/APIMessage";
export class PostEliminationGroupsByIdFinalizeAPI extends APIMessage<EliminationRoom> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined, public readonly input: EliminationFinalizeInput) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override get payload() { return this.input; }
  override send(): Promise<EliminationRoom> { return super.send(); }
}
