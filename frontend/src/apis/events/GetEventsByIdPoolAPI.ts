import type { Chart } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdPoolAPI extends APIMessage<Chart[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined, public readonly query: Record<string,string> = {}) { super(); }
  get parameters(): Record<string,string> { return { ...this.query, id: this.id ?? "" }; }
  override send(): Promise<Chart[]> { return super.send(); }
}
