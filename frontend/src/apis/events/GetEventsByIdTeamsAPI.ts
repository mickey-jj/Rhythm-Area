import type { Team } from "../../domain/apiRecords";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdTeamsAPI extends APIMessage<Team[]> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<Team[]> { return super.send(); }
}
