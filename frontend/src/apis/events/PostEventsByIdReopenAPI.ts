import type { VersionInput } from "../../domain/requests";
import type { Event } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class PostEventsByIdReopenAPI extends APIMessage<Event> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined, public readonly input: VersionInput) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override get payload() { return this.input; }
  override send(): Promise<Event> { return super.send(); }
}
