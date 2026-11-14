import { APIMessage } from "../../system/api/APIMessage";
export class GetHealthAPI extends APIMessage<{ status: string }> {
  readonly method = "GET" as const;
  constructor() { super(); }
  get parameters(): Record<string,string> { return {  }; }
  override send(): Promise<{ status: string }> { return super.send(); }
}
