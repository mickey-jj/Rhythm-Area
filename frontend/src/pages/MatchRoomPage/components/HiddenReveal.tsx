import {
Notice
} from "../../../components/ui";
import type { MatchReady } from "../objects/MatchState";
export function HiddenReveal({ page }: { page: MatchReady }) {
  const { busy, isOwner, act } = page;
  return (<section className={"panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_540px))]:[padding:20px] action-panel [&_h2]:[font-size:var(--type-23-28)] [&_h2]:[margin:17px_0_10px] [&_>_p]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[&_h2]:[font-size:var(--type-22-28)]"}>
              <span className={"eyebrow [font-family:'Segoe_UI',_sans-serif] [font-size:var(--type-8-18)] [letter-spacing:1.7px] [font-weight:500] [color:var(--palette-86a798)] [display:flex] [align-items:center] [gap:7px] [.bottom-banner_&]:[font-size:var(--type-7-18)] [.bottom-banner_&]:[color:var(--palette-759d80)] [.bottom-banner_&]:[letter-spacing:2px] [@media((max-width:_760px))]:[.hall-intro_&]:[font-size:var(--type-6-18)] [@media((max-width:_760px))]:[.hall-intro_&]:[letter-spacing:1.2px] [@media((max-width:_760px))]:[.bottom-banner_&]:[font-size:var(--type-6-18)] [@media((max-width:_760px))]:[.bottom-banner_&]:[letter-spacing:1.2px]"}>HIDDEN CHART / REVEAL</span>
              <h2>等待隐藏曲揭晓</h2>
              <Notice>
                曲目已确定，曲名与谱面信息仍对选手和观众保密。裁判在现场宣布后点击揭晓，随后开放交分。揭晓会在本赛事中永久公开该曲，重赛也不会恢复保密。
              </Notice>
              {isOwner && (
                <button
                  className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] primary [.hero-buttons_&]:[min-height:43px] [.hero-buttons_&]:[padding:12px_17px] full-width [width:100%]"}
                  disabled={busy}
                  onClick={() => act("reveal")}
                >
                  {busy ? "揭晓中…" : "确认公开隐藏曲并开始演奏"}
                </button>
              )}
            </section>);
}
