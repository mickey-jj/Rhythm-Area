import type { Ranking } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdRankingsAPI extends APIMessage<Ranking[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<Ranking[]> { return super.send(); }
}
