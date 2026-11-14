import type { Session } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetMeAPI extends APIMessage<Session> {
  readonly method = "GET" as const;
  constructor() { super(); }
  get parameters(): Record<string,string> { return {  }; }
  override send(): Promise<Session> { return super.send(); }
}
