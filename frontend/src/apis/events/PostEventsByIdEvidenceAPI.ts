import { APIMessage } from "../../system/api/APIMessage";
export class PostEventsByIdEvidenceAPI extends APIMessage<{ id: string; name: string; mime: string; size: number }> {
  readonly method = "POST" as const;
  constructor(public readonly id: string, public readonly file: File) { super(); }
  get parameters() { return { id: this.id }; }
  override get body() { return this.file; }
  override get headers() { return { "Content-Type": this.file.type, "X-File-Name": encodeURIComponent(this.file.name) }; }
  override send() { return super.send(); }
}
