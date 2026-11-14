import type { Event,EventInput } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class PutEventsByIdAPI extends APIMessage<Event> {
  readonly method = "PUT" as const;
  constructor(public readonly id: string | undefined, public readonly input: EventInput) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override get payload() { return this.input; }
  override send(): Promise<Event> { return super.send(); }
}
