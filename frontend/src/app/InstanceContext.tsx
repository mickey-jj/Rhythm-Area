import { createContext,useContext } from "react";
import type { Instance } from "../domain/types";
export const InstanceContext = createContext<Instance | null>(null);
export function useInstance() {
  const instance = useContext(InstanceContext);
  if (!instance) throw new Error("Instance context missing");
  return instance;
}
