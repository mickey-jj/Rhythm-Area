import { useOutletContext } from "react-router-dom";
import { Empty, ErrorBox, PageTitle } from "../../components/ui";
import type { Event } from "../../domain/types";
import { QualifierTasks } from "./components/QualifierTasks";
import { QualifierStandings } from "./components/QualifierStandings";
import { QualifierSubmissions } from "./components/QualifierSubmissions";
import { RankingClock } from "./components/RankingClock";
import { useQualifierPage } from "./hooks/useQualifierPage";
export function QualifierPage() {
  const event=useOutletContext<Event>();
  const page=useQualifierPage(event);
  if(page.status==="empty")return <Empty title="本赛事未启用排名赛 / 海选 / 刷分赛" />;
  return <div className="space-y-6"><PageTitle eyebrow="SCORE ATTACK / LIVE STANDINGS" title={page.qualifier.name} description="排名赛 / 海选 / 刷分赛" />{page.board.error && <ErrorBox error={page.board.error} />}<RankingClock page={page} /><QualifierStandings page={page} /><QualifierTasks page={page} /><QualifierSubmissions page={page} /></div>;
}
