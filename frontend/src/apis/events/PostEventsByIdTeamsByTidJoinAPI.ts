import { APIMessage } from "../../system/api/APIMessage";
export class PostEventsByIdTeamsByTidJoinAPI extends APIMessage<{ ok: boolean }> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined, public readonly tid: string) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "", tid: this.tid }; }
  override send(): Promise<{ ok: boolean }> { return super.send(); }
}
