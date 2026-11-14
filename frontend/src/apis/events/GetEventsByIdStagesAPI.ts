import type { StageRun } from "../../domain/apiRecords";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdStagesAPI extends APIMessage<StageRun[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<StageRun[]> { return super.send(); }
}
