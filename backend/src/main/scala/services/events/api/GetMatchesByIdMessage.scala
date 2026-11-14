package services.events.api

import cats.effect.{IO, Resource}
import cats.syntax.all.*
import java.sql.Connection
import java.nio.file.{Files, Path}
import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import services.system.api.*
import services.system.utils.*
import services.events.utils.*

final case class GetMatchesByIdMessage(idKey: MatchId, viewer: Option[String], lock: Boolean = false, privateData: Boolean = false) extends APIMessage[MatchView]:
  def plan(connection: Connection): IO[MatchView] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    for
          row <- (if lock then services.events.tables.matches.MatchesTable.findRepositoryMatchview(connection, id) else services.events.tables.matches.MatchesTable.findRepositoryMatchview2(connection, id)).flatMap(_.liftTo[IO](AppError(404,ApiError("NOT_FOUND","比赛不存在"))))
          (mid,eid,round,ord,a,b,w,s,v,ex,r) = row
          e <- ReadEventMessage(eid).plan(connection)
          _ <- visible(e,viewer)
          aa <- a.traverse(v => ReadEntryMessage(v).plan(connection))
          bb <- b.traverse(v => ReadEntryMessage(v).plan(connection))
          ac <- ReadActionsMessage(mid).plan(connection)
          slots <- services.events.tables.play_slots.PlaySlotsTable.findRepositoryMatchview(connection, id)
          charts <- ReadMatchChartsMessage(mid,eid).plan(connection)
          rules = readJson[RuleSet](r)
          ds = DraftState(ac)
          meta <- services.events.tables.matches.MatchesTable.findRepositoryMatchview3(connection, id)
          revealed = !rules.draftMode.contains("sealed") || Engine.currentStep(rules,ds).isEmpty
          privileged <- viewer.traverse(u => IsJudgeMessage(e,u,Some(id)).plan(connection)).map(_.contains(true))
          disclosed <- ReadRevealedChartsMessage(eid).plan(connection)
          hidden = charts.filter(c => Engine.roles(c).contains("mystery") && !disclosed(c.chart_key)).map(_.chart_key).toSet
          maskKey = (key: String) => if !privileged && !privateData && hidden(key) then opaqueChartId(eid,key) else key
          filtered = if revealed || privileged then ac else ac.map(a => if (a.actor=="A" && aa.exists(en => viewer.contains(en.userId))) || (a.actor=="B" && bb.exists(en => viewer.contains(en.userId))) then a else a.copy(chartKey="sealed"))
          candidates = Engine.eligibleCharts(rules,charts,ds).map(c=>if !privileged && !privateData && hidden(c.chart_key) then concealed(c,eid) else c)
          maySeeCandidates = revealed || privileged || Engine.currentStep(rules,ds).exists(step => (step.actor=="A" && aa.exists(en=>viewer.contains(en.userId))) || (step.actor=="B" && bb.exists(en=>viewer.contains(en.userId))))
          status <- IO.fromEither(MatchStatus.fromString(s).leftMap(message => AppError(500,ApiError("INVALID_STORED_STATE",message))))
    yield MatchView(mid,eid,round,ord,aa.map(_.copy(reason="")),bb.map(_.copy(reason="")),w,status.asInstanceOf[MatchStatus],v,ex,rules,filtered.map(a=>a.copy(chartKey=maskKey(a.chartKey))),slots.map(s=>s.copy(chartKey=maskKey(s.chartKey))),if maySeeCandidates && meta._4==ScheduleState.Current then candidates else Nil,if meta._4==ScheduleState.Current then Engine.currentStep(rules,ds) else None,meta._1,(if meta._4==ScheduleState.Historical then rules.stages else e.rules.stages).find(_.id==meta._1).map(_.name).getOrElse(meta._1),meta._2,meta._3,meta._4,rules.stages.find(_.id==meta._1).orElse(e.rules.stages.find(_.id==meta._1)).map(_.kind).getOrElse("single"))
