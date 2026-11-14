import type { Match } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetMatchesByIdAPI extends APIMessage<Match> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<Match> { return super.send(); }
}
