import type { Attempt } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdAttemptsAPI extends APIMessage<Attempt[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<Attempt[]> { return super.send(); }
}
