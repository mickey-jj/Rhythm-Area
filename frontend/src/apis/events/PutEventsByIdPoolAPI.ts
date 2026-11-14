import type { Event } from "../../domain/types";
import type { PoolAssignmentInput } from "../../domain/library";
import { APIMessage } from "../../system/api/APIMessage";
export class PutEventsByIdPoolAPI extends APIMessage<Event> {
  readonly method = "PUT" as const;
  constructor(public readonly id: string, public readonly input: PoolAssignmentInput) { super(); }
  get parameters(): Record<string,string> { return { id: this.id }; }
  override get payload(): PoolAssignmentInput { return this.input; }
  override send(): Promise<Event> { return super.send(); }
}
