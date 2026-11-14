import type { LibraryChart } from "../../domain/library";
import { APIMessage } from "../../system/api/APIMessage";
export type LibraryArtworkInput = { gameKey: string; items: { songKey: string; coverUrl: string | null }[] };
export class PutLibraryArtworkAPI extends APIMessage<LibraryChart[]> {
  readonly method = "PUT" as const;
  constructor(public readonly input: LibraryArtworkInput) { super(); }
  get parameters(): Record<string,string> { return {}; }
  override get payload(): LibraryArtworkInput { return this.input; }
  override send(): Promise<LibraryChart[]> { return super.send(); }
}
