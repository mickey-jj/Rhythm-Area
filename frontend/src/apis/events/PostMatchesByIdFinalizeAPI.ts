import type { VersionInput } from "../../domain/requests";
import { APIMessage } from "../../system/api/APIMessage";
export class PostMatchesByIdFinalizeAPI extends APIMessage<{ message: string }> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined, public readonly input: VersionInput) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override get payload() { return this.input; }
  override send(): Promise<{ message: string }> { return super.send(); }
}
