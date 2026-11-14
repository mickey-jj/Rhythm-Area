import type { EliminationRoom } from "../../domain/eliminationGroups";
import type { MatchResetInput } from "../../domain/requests";
import { APIMessage } from "../../system/api/APIMessage";
export class PostEliminationGroupsByIdResetAPI extends APIMessage<EliminationRoom> {
  readonly method="POST" as const;
  constructor(public readonly id:string,public readonly input:MatchResetInput){super();}
  get parameters():Record<string,string>{return {id:this.id};}
  override get payload(){return this.input;}
  override send():Promise<EliminationRoom>{return super.send();}
}
