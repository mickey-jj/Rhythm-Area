import type { TeamFormationView } from "../../domain/teamFormation";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdTeamFormationAPI extends APIMessage<TeamFormationView> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<TeamFormationView> { return super.send(); }
}
