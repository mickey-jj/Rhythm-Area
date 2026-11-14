import { APIMessage } from "../../system/api/APIMessage";
export class PostInstanceDemoDataAPI extends APIMessage<{ ok: boolean }> {
  readonly method = "POST" as const;
  constructor() { super(); }
  get parameters(): Record<string,string> { return {  }; }
  override send(): Promise<{ ok: boolean }> { return super.send(); }
}
