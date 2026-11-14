import type { EventInput } from "../../../domain/types";
import type { useEventEditor } from "../hooks/useEventEditor";
export type EditorReady = ReturnType<typeof useEventEditor> & { draft: EventInput };

export type EditorOperation = "" | "save" | "validate" | "simulate" | "publish" | "autosave" | "reopen" | "demo";
export type EditorViewState =
  | { kind: "setup" }
  | { kind: "sign-in" }
  | { kind: "error"; error: unknown }
  | { kind: "loading" }
  | { kind: "ready"; draft: EventInput };
