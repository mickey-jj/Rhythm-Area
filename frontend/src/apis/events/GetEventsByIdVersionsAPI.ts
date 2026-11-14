import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdVersionsAPI extends APIMessage<{ version: number; at: string }[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<{ version: number; at: string }[]> { return super.send(); }
}
