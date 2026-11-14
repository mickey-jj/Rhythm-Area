import { APIMessage } from "../../system/api/APIMessage";
export class PostEventsByIdTeamDraftStartAPI extends APIMessage<{ ok: boolean }> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<{ ok: boolean }> { return super.send(); }
}
