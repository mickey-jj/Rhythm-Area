import type { Validation } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class PostEventsByIdValidateAPI extends APIMessage<Validation> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<Validation> { return super.send(); }
}
