import type { Template } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetTemplatesAPI extends APIMessage<Template[]> {
  readonly method = "GET" as const;
  constructor() { super(); }
  get parameters(): Record<string,string> { return {  }; }
  override send(): Promise<Template[]> { return super.send(); }
}
