import { ArrowRight,ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRefresh } from "../../../api/client";
import { InstanceSetupAPI } from "../../../apis/instance/InstanceSetupAPI";
import { ErrorBox,Notice,PageTitle } from "../../../components/ui";
import { setCurrentSession } from "../../../state/session";
export function SetupOwner() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const refresh = useRefresh();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError(new Error("两次输入的密码不一致"));
      return;
    }
    setBusy(true);
    try {
      const s = await (new InstanceSetupAPI({
        username,
        password,
        displayName: name,
        setupToken,
      })).send();
      setCurrentSession(s);
      await refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={"setup-owner [&_.panel_>_svg]:[margin-bottom:23px]"}>
      <PageTitle
        title="先为这场比赛，建立主办身份。"
      />
      <div className={"two-column [display:grid] [grid-template-columns:minmax(0,_1.85fr)_minmax(270px,_1fr)] [gap:22px] [align-items:start] [&_>_div]:[min-width:0] [&_>_aside]:[min-width:0] [@media((max-width:_1250px))]:[grid-template-columns:minmax(0,_1.65fr)_minmax(265px,_1fr)] [@media((max-width:_1250px))]:[gap:16px] [@media((max-width:_1000px))]:[grid-template-columns:1fr] [@media((max-width:_1000px))]:[&_>_aside]:[display:grid] [@media((max-width:_1000px))]:[&_>_aside]:[grid-template-columns:1fr_1fr] [@media((max-width:_1000px))]:[&_>_aside]:[gap:16px] [@media((max-width:_1000px))]:[&_>_aside_>_.panel]:[margin-bottom:0] [@media((max-width:_540px))]:[&_>_aside]:[grid-template-columns:1fr] [@media((max-width:_540px))]:[gap:0]"}>
        <form className={"panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_540px))]:[padding:20px]"} onSubmit={submit}>
          <div className={"form-grid [display:grid] [grid-template-columns:1fr_1fr] [gap:20px_17px] [&_>_.full]:[grid-column:1/-1] [&_label]:[font-size:var(--type-11-19)] [&_input]:[font-size:var(--type-12-19)] [&_select]:[font-size:var(--type-12-19)] [@media((max-width:_540px))]:[grid-template-columns:1fr] [@media((max-width:_540px))]:[gap:17px] [@media((max-width:_540px))]:[&_>_*]:[grid-column:1]"}>
            <label className="col-span-full">
              部署初始化码（必填）
              <input required type="password" autoComplete="off" value={setupToken} onChange={e=>setSetupToken(e.target.value)} />
              <small>由部署者提供。本机启动生成在项目 .local/setup-token 文件中，仅首次建立主办身份时使用。</small>
            </label>
            <label>
              管理账号
              <input
                required
                pattern="[a-zA-Z0-9_-]{3,32}"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="3–32 位英文、数字或下划线"
              />
            </label>
            <label>
              显示昵称
              <input
                required
                maxLength={50}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              管理密码
              <input
                type="password"
                minLength={10}
                maxLength={256}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label>
              再次确认密码
              <input
                type="password"
                minLength={10}
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          </div>
          {error != null && <ErrorBox error={error} />}
          <button className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] primary [.hero-buttons_&]:[min-height:43px] [.hero-buttons_&]:[padding:12px_17px] setup-submit [margin-top:25px]"} disabled={busy}>
            {busy ? "建立中…" : "建立主办身份，继续定义赛事"}
            <ArrowRight size={16} />
          </button>
        </form>
        <aside className={"panel [border:1px_solid_var(--line)] [border-radius:var(--radius)] [background:var(--panel)] [padding:26px] [margin-bottom:20px] [&_>_h2]:[font-size:var(--type-20-22)] [&_.section-heading]:[margin-bottom:19px] [&_.section-heading_h2]:[font-size:var(--type-16-20)] [@media((max-width:_1250px))]:[padding:22px] [@media((max-width:_540px))]:[padding:20px]"}>
          <ShieldCheck className={"accent [color:var(--accent)]"} size={32} />
          <h2>一份部署，一场比赛。</h2>

          <Notice>
            复用时只导出配置与图池。在新部署中建立新账号和运行数据。
          </Notice>
        </aside>
      </div>
    </div>
  );
}
