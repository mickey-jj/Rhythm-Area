import type { EventInput } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetInstanceExportAPI extends APIMessage<EventInput> {
  readonly method = "GET" as const;
  constructor() { super(); }
  get parameters(): Record<string,string> { return {  }; }
  override send(): Promise<EventInput> { return super.send(); }
}
