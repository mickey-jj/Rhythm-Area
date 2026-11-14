import type { QualificationInput } from "../../domain/requests";
import { APIMessage } from "../../system/api/APIMessage";
export class PostEventsByIdStagesBySidQualificationAPI extends APIMessage<{ ok: boolean }> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined, public readonly sid: string | undefined, public readonly input: QualificationInput) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "", sid: this.sid ?? "" }; }
  override get payload() { return this.input; }
  override send(): Promise<{ ok: boolean }> { return super.send(); }
}
