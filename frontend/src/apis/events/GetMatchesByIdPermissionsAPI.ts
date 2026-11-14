import { APIMessage } from "../../system/api/APIMessage";
export class GetMatchesByIdPermissionsAPI extends APIMessage<{ judge: boolean }> {
  readonly method = "GET" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<{ judge: boolean }> { return super.send(); }
}
