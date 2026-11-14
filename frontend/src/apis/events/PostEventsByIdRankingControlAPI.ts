import type { RankingBoard, RankingControlInput } from "../../domain/ranking";
import { APIMessage } from "../../system/api/APIMessage";
export class PostEventsByIdRankingControlAPI extends APIMessage<RankingBoard> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined, public readonly input: RankingControlInput) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override get payload() { return this.input; }
  override send(): Promise<RankingBoard> { return super.send(); }
}
