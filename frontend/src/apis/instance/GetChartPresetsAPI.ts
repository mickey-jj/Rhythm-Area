import type { ChartPreset } from "../../domain/library";
import { APIMessage } from "../../system/api/APIMessage";
export class GetChartPresetsAPI extends APIMessage<{ presets: ChartPreset[] }> {
  readonly method = "GET" as const;
  get parameters(): Record<string,string> { return {}; }
  override send(): Promise<{ presets: ChartPreset[] }> { return super.send(); }
}
