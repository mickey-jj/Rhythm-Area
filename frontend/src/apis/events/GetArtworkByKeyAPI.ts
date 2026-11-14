import { APIMessage } from "../../system/api/APIMessage";
export class GetArtworkByKeyAPI extends APIMessage<Blob> {
  readonly method = "GET" as const;
  constructor(public readonly key: string) { super(); }
  get parameters(): Record<string,string> { return { key: this.key }; }
  override get responseKind(): "blob" { return "blob"; }
  override send(): Promise<Blob> { return super.send(); }
}
