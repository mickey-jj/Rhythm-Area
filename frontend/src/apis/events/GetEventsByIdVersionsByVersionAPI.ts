import type { EventInput } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdVersionsByVersionAPI extends APIMessage<EventInput> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined, public readonly version: string) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "", version: this.version }; }
  override send(): Promise<EventInput> { return super.send(); }
}
