import type { DraftAction } from "../../domain/types";
import { APIMessage } from "../../system/api/APIMessage";
export class PostEventsByIdSimulateAPI extends APIMessage<{ actions: DraftAction[]; playOrder: { slotId: string; chartKey: string }[]; error: { message: string } | null }> {
  readonly method = "POST" as const;
  constructor(public readonly id: string | undefined) { super(); }
  get parameters(): Record<string,string> { return { id: this.id ?? "" }; }
  override send(): Promise<{ actions: DraftAction[]; playOrder: { slotId: string; chartKey: string }[]; error: { message: string } | null }> { return super.send(); }
}
