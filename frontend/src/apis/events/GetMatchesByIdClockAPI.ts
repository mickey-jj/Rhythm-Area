import {APIMessage} from "../../system/api/APIMessage";
import type {MatchClockBoard} from "../../domain/matchClock";
export class GetMatchesByIdClockAPI extends APIMessage<MatchClockBoard> {
 readonly method="GET" as const;
 constructor(public readonly id:string|undefined){super();}
 get parameters():Record<string,string>{return {id:this.id ?? ""};}
 
 override send():Promise<MatchClockBoard>{return super.send();}
}
