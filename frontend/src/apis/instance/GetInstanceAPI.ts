import type { Instance } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetInstanceAPI extends APIMessage<Instance> {
  readonly method = "GET" as const;
  constructor() { super(); }
  get parameters(): Record<string,string> { return {  }; }
  override send(): Promise<Instance> { return super.send(); }
}
