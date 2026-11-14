import { APIMessage } from "../../system/api/APIMessage";
export type ArtworkView = { key: string; url: string; mime: string; size: number };
export class PostLibraryArtworkAPI extends APIMessage<ArtworkView> {
  readonly method = "POST" as const;
  constructor(public readonly file: File) { super(); }
  get parameters(): Record<string,string> { return {}; }
  override get body(): BodyInit { return this.file; }
  override get headers(): Record<string,string> { return { "Content-Type": this.file.type || "application/octet-stream" }; }
  override send(): Promise<ArtworkView> { return super.send(); }
}
