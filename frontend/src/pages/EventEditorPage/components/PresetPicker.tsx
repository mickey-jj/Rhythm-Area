import type { EditorReady } from "../objects/EditorState";
export function PresetPicker({ page }: { page: EditorReady }) {
  const { instance, templates, setStep, preset, setPreset, edit } = page;
  return (<div className={"preset-picker [display:flex] [align-items:center] [gap:16px] [flex-wrap:wrap] [padding:18px_23px] [&_label]:[min-width:240px] [&_label]:[flex:1] [&_select]:[font-size:var(--type-12-19)] [&_>_span]:[width:100%] [@media((max-width:_540px))]:[padding:17px] [@media((max-width:_540px))]:[&_label]:[min-width:0] [@media((max-width:_540px))]:[&_label]:[width:100%] [@media((max-width:_540px))]:[&_label]:[flex:auto] [@media((max-width:_540px))]:[&_button]:[width:100%] panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_540px))]:[padding:20px]"}>
        <label>
          可选起始配置
          <select value={preset} onChange={(e) => setPreset(e.target.value)}>
            {templates.data?.map((t) => (
              <option value={t.id} key={t.id}>
                {t.presetLabel ?? t.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] secondary [.bottom-banner_&]:[border-color:var(--palette-4e6353)] [.bottom-banner_&]:[background:var(--palette-354d3a)] [.bottom-banner_&]:[color:var(--palette-c9dec9)]"}
          onClick={() => {
            const t = templates.data?.find((t) => t.id === preset);
            if (t) {
              edit({
                name: t.name,
                tagline: t.tagline ?? "",
                description: t.description,
                rules: structuredClone(t.rules),
                charts: structuredClone(t.charts),
                appearance: structuredClone(
                  t.appearance ?? instance.appearance,
                ),
              });
              setStep(0);
            }
          }}
        >
          应用所选配置
        </button>

      </div>);
}
