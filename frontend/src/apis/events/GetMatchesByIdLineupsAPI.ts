import { APIMessage } from "../../system/api/APIMessage";
export class GetMatchesByIdLineupsAPI extends APIMessage<{ entryId: string; slotId: string; userId: string }[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<{ entryId: string; slotId: string; userId: string }[]> { return super.send(); }
}
