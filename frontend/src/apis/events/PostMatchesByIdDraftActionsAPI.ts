import type { DraftInput } from "../../domain/requests";
import type { Match } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class PostMatchesByIdDraftActionsAPI extends APIMessage<Match> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined, public readonly input: DraftInput) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override get payload() { return this.input; }
  override send(): Promise<Match> { return super.send(); }
}
