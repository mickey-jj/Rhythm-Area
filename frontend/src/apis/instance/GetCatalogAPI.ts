import type { Chart } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class GetCatalogAPI extends APIMessage<{ total: number; page: number; items: Chart[] }> {
  readonly method = "GET" as const;
  constructor(public readonly query: Record<string,string> = {}) { super(); }
  get parameters(): Record<string,string> { return { ...this.query,  }; }
  override send(): Promise<{ total: number; page: number; items: Chart[] }> { return super.send(); }
}
