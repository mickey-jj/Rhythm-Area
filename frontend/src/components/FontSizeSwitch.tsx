import { useEffect,useState } from "react";

export function FontSizeSwitch() {
  const [size, setSize] = useState(() => {
    try {
      return localStorage.getItem("area-reading-size") === "large"
        ? "large"
        : "normal";
    } catch {
      return "normal";
    }
  });
  useEffect(() => {
    document.documentElement.style.removeProperty("--font-scale");
    document.documentElement.style.removeProperty("--reading-adjust");
    document.documentElement.dataset.readingSize = size;
    try {
      localStorage.removeItem("area-font-size");
      localStorage.setItem("area-reading-size", size);
    } catch {
      /* Keep the session preference. */
    }
  }, [size]);
  return (
    <div
      className={"theme-switch [display:inline-flex] [gap:3px] [border:1px_solid_var(--line)] [padding:3px] [border-radius:9px] [&_button]:[display:grid] [&_button]:[place-items:center] [&_button]:[border:0] [&_button]:[border-radius:5px] [&_button]:[background:transparent] [&_button]:[color:var(--muted)] [&_button]:[padding:7px] [&_button.active]:[background:var(--panel2)] [&_button.active]:[color:var(--accent)] [@media((max-width:_750px))]:[&_button]:[padding:6px] font-size-switch [&_button]:[min-width:30px] [&_button]:[font-size:var(--type-12-19)] [&_button]:[font-weight:600] [&_button]:[padding:7px_10px] [&_button]:[min-height:38px] [&_button]:[white-space:nowrap]"}
      role="group"
      aria-label="字号调整"
    >
      <button
        type="button"
        aria-label="标准字号"
        aria-pressed={size === "normal"}
        className={size === "normal" ? "active" : ""}
        onClick={() => setSize("normal")}
      >
        标准字
      </button>
      <button
        type="button"
        aria-label="更大字号"
        aria-pressed={size === "large"}
        className={size === "large" ? "active" : ""}
        onClick={() => setSize("large")}
      >
        大字
      </button>
    </div>
  );
}
