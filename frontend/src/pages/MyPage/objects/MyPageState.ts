import type { Session } from "../../../domain/types";
import type { useMyPage } from "../hooks/useMyPage";
export type MyPageReady = ReturnType<typeof useMyPage> & { session: Session };
