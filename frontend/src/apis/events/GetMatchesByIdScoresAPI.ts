import { APIMessage } from "../../system/api/APIMessage";
import type { PublicScore } from "../../domain/publicScore";
export class GetMatchesByIdScoresAPI extends APIMessage<PublicScore[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<PublicScore[]> { return super.send(); }
}
