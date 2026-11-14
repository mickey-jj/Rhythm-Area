import type { Appeal } from "../../domain/apiRecords";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdAppealsAPI extends APIMessage<Appeal[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<Appeal[]> { return super.send(); }
}
