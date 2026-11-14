import { ArrowRight,AudioLines,Flag } from "lucide-react";
import { Link } from "react-router-dom";
import { useInstance } from "../../app/InstanceContext";
export function PreparationPage() {
  const instance = useInstance();
  return (
    <section className={"preparation [max-width:820px] [margin:25px_auto] [padding:42px_25px_55px] [background:radial-gradient(_ellipse_at_80%_35%,_var(--palette-a3edd10d),_transparent_65%_)] [&_h1]:[font-size:clamp(30px,_4vw,_52px)] [&_h1]:[line-height:1.45] [&_h1]:[letter-spacing:-1px] [&_h1_span]:[color:var(--accent)] [&_p]:[max-width:540px] [&_p]:[color:var(--muted)] [&_p]:[font-size:var(--type-13-20)] [&_p]:[line-height:2.1] [&_p]:[margin:24px_0] [@media((max-width:_540px))]:[padding:20px_0] [@media((max-width:_540px))]:[&_.eyebrow]:[font-size:var(--type-6-18)] [@media((max-width:_540px))]:[&_.eyebrow]:[letter-spacing:1px] [@media((max-width:_540px))]:[&_h1]:[font-size:var(--type-31-36)] [@media((max-width:_540px))]:[&_p]:[font-size:var(--type-12-19)]"}>
      <div className={"preparation-symbol [color:var(--accent)] [margin:40px_0_25px]"}>
        <AudioLines size={82} />
      </div>
      <h1>{instance.needsSetup ? "创建赛事" : "赛事筹备中"}</h1>
      <p>
        {instance.needsSetup
          ? "创建主办账号后配置赛事。"
          : "赛事尚未发布。"}
      </p>
      <Link
        className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] primary [.hero-buttons_&]:[min-height:43px] [.hero-buttons_&]:[padding:12px_17px]"}
        to={
          instance.needsSetup || instance.isOwner
            ? "/manage/config"
            : "/auth?returnTo=/manage/config"
        }
      >
        <Flag size={16} />
        {instance.needsSetup
          ? "初始化这场比赛"
          : instance.isOwner
            ? "继续配置赛事"
            : "主办方登录"}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
