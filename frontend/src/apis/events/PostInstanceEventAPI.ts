import type { Event,EventInput } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class PostInstanceEventAPI extends APIMessage<Event> {
  readonly method = "POST" as const;
  constructor(public readonly input: EventInput) { super(); }
  get parameters(): Record<string,string> { return {  }; }
  override get payload() { return this.input; }
  override send(): Promise<Event> { return super.send(); }
}
