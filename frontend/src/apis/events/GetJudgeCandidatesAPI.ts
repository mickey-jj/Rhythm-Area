import type { User } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetJudgeCandidatesAPI extends APIMessage<User[]> {
 readonly method="GET" as const;
 constructor(public readonly id:string,public readonly search:string){super();}
 get parameters():Record<string,string>{return {id:this.id,search:this.search};}
 override send():Promise<User[]>{return super.send();}
}
