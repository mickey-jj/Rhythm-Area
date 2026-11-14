import { useState } from "react";
import { useApi,useRefresh } from "../../api/client";
import { GetEventsByIdTeamsAPI } from "../../apis/events/GetEventsByIdTeamsAPI";
import { PostEventsByIdAttemptsAPI } from "../../apis/events/PostEventsByIdAttemptsAPI";
import { ErrorBox,Notice } from "../../components/ui";
import type { Entry,Event,Attempt } from "../../domain/types";
import type { Team } from "../../features/events/TeamCenter";
import { EvidenceInput } from "../../features/scoring/EvidenceInput";
export function TeamQualifier({
  event: e,
  entry,
  slots,
  groupId,previous,lockedIds=[],
}: {
  event: Event;
  entry: Entry;
  slots: { id: string; title: string }[];
  groupId?: string;previous?:Attempt;lockedIds?:string[];
}) {
  const teams = useApi<Team[]>(new GetEventsByIdTeamsAPI(e.id));
  const team = teams.data?.find((t) => t.entryId === entry.id);
  const refresh = useRefresh();
  const [members, setMembers] = useState<Record<string, string[]>>(Object.fromEntries(slots.map(s=>[s.id,previous?.memberScores?.filter(m=>m.slotId===s.id).map(m=>m.userId)??[]])));
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(previous?.memberScores?.map(m=>[m.slotId+"@"+m.userId,m.value])??[]));
  const [note, setNote] = useState("");
  const [fid, setFid] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  return (
    <section>
      <Notice>
        {groupId ? "本轮团队成绩" : "本次完整团队海选"}：每曲选择 {e.rules.team.perChart} 人，单次每人最多出场{" "}
        {e.rules.team.maxAppearances}{" "}
        次。所有成员来自冻结名单；原始个人成绩与聚合结果一同保存。
      </Notice>
      {slots.map((s) => (
        <div className={"import-guide [margin:16px_0] [border:1px_solid_var(--line)] [border-radius:8px] [padding:14px] [line-height:1.8] [&_summary]:[cursor:pointer] [&_summary]:[font-weight:650] [&_code]:[overflow-wrap:anywhere]"} key={s.id}>
          <h3>{s.title}</h3>
          {team?.members.map((member) => (
            <div key={member.id}>
              <label className={"check-label [font-size:var(--type-8-18)] [flex-direction:row] [align-items:center] [gap:4px] [line-height:1.5] [&_input]:[padding:0] [&_input]:[margin:0] [&_input]:[width:12px]"}>
                <input
                  type="checkbox"
                  disabled={lockedIds.includes(s.id)}
                  checked={members[s.id]?.includes(member.id) ?? false}
                  onChange={(ev) => {
                    const old = members[s.id] ?? [];
                    setMembers({
                      ...members,
                      [s.id]: ev.target.checked
                        ? [...old, member.id]
                        : old.filter((id) => id !== member.id),
                    });
                  }}
                />
                {member.displayName}
              </label>
              {members[s.id]?.includes(member.id) && (
                <label>
                  {member.displayName} · {e.rules.metric.name}
                  <input
                    inputMode="decimal"
                      readOnly={lockedIds.includes(s.id)}
                    value={values[s.id + "@" + member.id] ?? ""}
                    onChange={(ev) =>
                      setValues({
                        ...values,
                        [s.id + "@" + member.id]: ev.target.value,
                      })
                    }
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      ))}
      <label>
        完整尝试说明
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
        />
      </label>
      <EvidenceInput eventId={e.id} onChange={setFid} />
      <button
        className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] primary [.hero-buttons_&]:[min-height:43px] [.hero-buttons_&]:[padding:12px_17px]"}
        disabled={busy || !note.trim()}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await (new PostEventsByIdAttemptsAPI(e.id, {
              entryId: entry.id,
              matchId: null,
              groupId: groupId ?? null,
              items: [],
              memberScores: slots.flatMap((s) =>
                (members[s.id] ?? []).map((userId) => ({
                  slotId: s.id,
                  userId,
                  value: values[s.id + "@" + userId] ?? "",
                })),
              ),
              evidenceNote: note,
              evidenceId: fid,
            })).send();
            setNote("");
            await refresh();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        提交完整团队海选
      </button>
      {error != null && <ErrorBox error={error} />}
    </section>
  );
}
