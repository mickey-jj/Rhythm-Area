import type { Entry } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdEntriesAPI extends APIMessage<Entry[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<Entry[]> { return super.send(); }
}
