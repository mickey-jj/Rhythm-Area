import type { EntryInput } from "../../domain/requests";
import type { Entry } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class PostEventsByIdEntriesAPI extends APIMessage<Entry> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined, public readonly input: EntryInput) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override get payload() { return this.input; }
  override send(): Promise<Entry> { return super.send(); }
}
