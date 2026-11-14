import type { BracketKind, Match, StageKind } from "../../../domain/types";
import { bracketNames, roundLabel } from "../../../domain/stagePresentation";
import { MatchCard } from "./MatchCard";
import type { EliminationGroup } from "../../../domain/eliminationGroups";
import { EliminationCard } from "./EliminationCard";
export function MatchBoard({matches,view,kind,groups=[]}:{matches:Match[];view:"rounds"|"list";kind:StageKind;groups?:EliminationGroup[]}) {
  if (!matches.length) return <p className="py-3 text-[var(--muted)]">本阶段尚无对局。</p>;
  if(view==="list")return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map(g=><EliminationCard key={g.id} group={g} />)}{matches.map(m=><MatchCard key={m.id} match={m} kind={kind}/>)}</div>;
  const brackets: BracketKind[]=["winners","losers","final","reset","round-robin"];
  return <div className="space-y-6 text-[length:var(--type-13-20)]">{brackets.filter(b=>matches.some(m=>m.bracket===b) || b==="losers" && groups.length).map(bracket=><section key={bracket} aria-label={kind==="single"?"单败对阵":bracketNames[bracket]}>
    <h3 className="mb-3 text-[length:var(--type-16-20)] font-semibold">{kind==="single"?"单败对阵":bracketNames[bracket]}</h3>
    <div className="max-w-full overflow-x-auto pb-3"><div className="flex min-w-max gap-5">
      {[...new Set([...matches.filter(m=>m.bracket===bracket).map(m=>m.round),...(bracket==="losers" ? groups.map(g=>g.round) : [])])].sort((a,b)=>a-b).map(round=><div key={round} className="w-72 space-y-4">
        <h4 className="text-[length:var(--type-13-20)] text-[var(--muted)]">{roundLabel(bracket,round,kind)}</h4>
        {bracket==="losers" && groups.filter(g=>g.round===round).map(g=><EliminationCard key={g.id} group={g} />)}
        {matches.filter(m=>m.bracket===bracket&&m.round===round).map(m=><MatchCard key={m.id} match={m} kind={kind}/>)}
      </div>)}
    </div></div>
  </section>)}</div>;
}
