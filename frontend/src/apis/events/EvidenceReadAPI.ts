import { APIMessage } from "../../system/api/APIMessage";
export class EvidenceReadAPI extends APIMessage<Blob> {
  readonly method = "GET" as const;
  constructor(public readonly id: string) { super(); }
  get parameters() { return { id: this.id }; }
  override get responseKind() { return "blob" as const; }
  override send(): Promise<Blob> { return super.send(); }
}
