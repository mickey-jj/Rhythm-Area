import { useOutletContext } from "react-router-dom";
import { Empty, ErrorBox, PageTitle } from "../../components/ui";
import type { Event } from "../../domain/types";
import { QualifierTasks } from "./components/QualifierTasks";
import { QualifierStandings } from "./components/QualifierStandings";
import { QualifierSubmissions } from "./components/QualifierSubmissions";
import { RankingClock } from "../../features/ranking/RankingClock";
import { useRankingStage } from "../../features/ranking/useRankingStage";
export function QualifierPage() {
  const event=useOutletContext<Event>();
  const page=useRankingStage(event);
  if(page.status==="empty")return <Empty title="本赛事未启用排名赛 / 海选 / 刷分赛" />;
  return <div className="space-y-6"><PageTitle eyebrow="SCORE ATTACK / LIVE STANDINGS" title={page.qualifier.name} description="排名赛 / 海选 / 刷分赛" action={<a className="rounded-xl bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)]" href="#ranking-submit">{page.mine&&page.accepting?"立即提交成绩":"查看交分状态"}</a>}/>{page.board.error && <ErrorBox error={page.board.error} />}<RankingClock page={page} /><QualifierSubmissions page={page} /><QualifierTasks page={page} /><QualifierStandings page={page} /></div>;
}
