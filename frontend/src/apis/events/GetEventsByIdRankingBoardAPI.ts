import type { RankingBoard } from "../../domain/ranking";
import { APIMessage } from "../../system/api/APIMessage";
export class GetEventsByIdRankingBoardAPI extends APIMessage<RankingBoard> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<RankingBoard> { return super.send(); }
}
