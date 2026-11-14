import type { Audit } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdAuditAPI extends APIMessage<Audit[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<Audit[]> { return super.send(); }
}
