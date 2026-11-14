import type { Chart } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetCatalogSnapshotAPI extends APIMessage<Chart[]> {
  readonly method = "GET" as const;
  constructor() { super(); }
  get parameters(): Record<string,string> { return {  }; }
  override send(): Promise<Chart[]> { return super.send(); }
}
