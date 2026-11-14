import { create } from "zustand";
type Theme = "light" | "dark" | "system";
const read = (): Theme => {
  try {
    const saved = localStorage.getItem("area-theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
};
const store = create<{ theme: Theme }>(() => ({ theme: read() }));
export const useTheme = () => store((state) => state.theme);
export function setTheme(theme: Theme) {
  store.setState({ theme });
  try {
    localStorage.setItem("area-theme", theme);
  } catch {
    /* Private mode still supports this session. */
  }
}
