import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdJudgesAPI extends APIMessage<{ username: string; name: string; matchId: string }[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<{ username: string; name: string; matchId: string }[]> { return super.send(); }
}
