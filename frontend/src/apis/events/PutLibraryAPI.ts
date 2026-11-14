import type { LibraryChart, LibraryImportInput } from "../../domain/library";
import { APIMessage } from "../../system/api/APIMessage";
export class PutLibraryAPI extends APIMessage<LibraryChart[]> {
  readonly method = "PUT" as const;
  constructor(public readonly input: LibraryImportInput) { super(); }
  get parameters(): Record<string,string> { return {}; }
  override get payload(): LibraryImportInput { return this.input; }
  override send(): Promise<LibraryChart[]> { return super.send(); }
}
