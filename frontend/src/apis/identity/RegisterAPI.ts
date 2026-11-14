import type { Credentials } from "../../domain/requests";
import type { Session } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class RegisterAPI extends APIMessage<Session> {
  readonly method = "POST" as const;
  constructor(public readonly input: Credentials) { super(); }
  get parameters(): Record<string,string> { return {  }; }
  override get payload() { return this.input; }
  override send(): Promise<Session> { return super.send(); }
}
