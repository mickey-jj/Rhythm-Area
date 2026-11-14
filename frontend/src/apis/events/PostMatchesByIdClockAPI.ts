import {APIMessage} from "../../system/api/APIMessage";
import type {MatchClockBoard,ClockAction} from "../../domain/matchClock";
export class PostMatchesByIdClockAPI extends APIMessage<MatchClockBoard> {
 readonly method="POST" as const;
 constructor(public readonly id:string|undefined,public readonly input:{action:ClockAction;expectedVersion:number}){super();}
 get parameters():Record<string,string>{return {id:this.id ?? ""};}
 override get payload(){return this.input;}
 override send():Promise<MatchClockBoard>{return super.send();}
}
