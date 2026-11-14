import { Monitor,Moon,Sun } from "lucide-react";
import { useEffect } from "react";
import { setTheme,useTheme } from "../state/theme";
export function ThemeSwitch() {
  const theme = useTheme();
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return (
    <div className={"theme-switch [display:inline-flex] [gap:3px] [border:1px_solid_var(--line)] [padding:3px] [border-radius:9px] [&_button]:[display:grid] [&_button]:[place-items:center] [&_button]:[border:0] [&_button]:[border-radius:5px] [&_button]:[background:transparent] [&_button]:[color:var(--muted)] [&_button]:[padding:7px] [&_button.active]:[background:var(--panel2)] [&_button.active]:[color:var(--accent)] [@media((max-width:_750px))]:[&_button]:[padding:6px]"} role="group" aria-label="日夜模式">
      {(
        [
          { value: "light", label: "日间模式", Icon: Sun },
          { value: "dark", label: "夜间模式", Icon: Moon },
          { value: "system", label: "跟随系统", Icon: Monitor },
        ] as const
      ).map(({ value, label, Icon }) => (
        <button
          key={value}
          aria-label={label}
          title={label}
          aria-pressed={theme === value}
          className={theme === value ? "active" : ""}
          onClick={() => setTheme(value)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
