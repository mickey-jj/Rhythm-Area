import { create } from "zustand";
import type { Session } from "../domain/types";
const sessionStore = create<{ current: Session | null }>(() => ({
  current: null,
}));
export const useCurrentSession = () => sessionStore((s) => s.current);
export const setCurrentSession = (session: Session | null) =>
  sessionStore.setState({ current: session });
export const getCurrentSessionSnap = () => sessionStore.getState().current;
