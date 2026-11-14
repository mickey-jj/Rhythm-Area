import type { LibraryChart } from "../../domain/library";
import { APIMessage } from "../../system/api/APIMessage";
export class GetLibraryAPI extends APIMessage<LibraryChart[]> {
  readonly method = "GET" as const;
  constructor(public readonly game: string) { super(); }
  get parameters(): Record<string,string> { return { game: this.game }; }
  override send(): Promise<LibraryChart[]> { return super.send(); }
}
