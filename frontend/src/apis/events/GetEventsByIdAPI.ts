import type { Event } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdAPI extends APIMessage<Event> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<Event> { return super.send(); }
}
