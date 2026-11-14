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

final case class PostEventsByIdGenerateMessage(idKey: EventId, user: User, input: VersionInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val version = input.expectedVersion
    val result = {
      val id = idKey.value
      val service = new ServiceSupport(connection)
      import service.*
      val repo = new RepositorySupport(connection)
      import repo.*
      val competition = new CompetitionSupport(connection)
      val teams = new TeamsSupport(connection)
      (for
          e <- ReadEventMessage(id,true).plan(connection)
          _ <- RequireEventOwnerMessage(e,user.id).plan(connection)
          _ <- requireVersion(e.version,version)
          _ <- check(e.status == "registration",409,"INVALID_STATE","仅报名阶段可生成对阵并冻结名单")
          es <- ReadEntriesMessage(id).plan(connection).map(_.filter(_.status == "accepted"))
          _ <- check(es.size >= 2,400,"INSUFFICIENT_ENTRIES","至少需要两方已通过参赛者")
          pending <- services.events.tables.attempts.AttemptsTable.findServiceGenerate(connection, id)
          _ <- check(pending == 0,409,"PENDING_REVIEWS","请先处理排名赛待审成绩")
          board <- new RankingSupport(connection).synchronize(e)
          ranks <- rankingsTx(e)
          ranked = ranks.filter(_.complete)
          hasQualifier = e.rules.stages.headOption.exists(_.kind == "ranking")
          stopped=board.exists(_.session.status=="closed")
          _ <- check(!hasQualifier || stopped || board.exists(_.session.policy.endMode=="manual") && ranked.size==es.size,409,"RANKING_OPEN","请先结束排名赛收分，再确认晋级")
          _ <- check(!hasQualifier || stopped || ranked.size==es.size,409,"INCOMPLETE_QUALIFIER","排名赛尚未全员完成，可先停止收分后按完整有效成绩确认晋级")
          _ <- check(!hasQualifier || ranked.size>=math.min(e.rules.stages.head.advance,es.size),409,"INSUFFICIENT_QUALIFIERS","完整有效成绩不足以满足实际晋级名额，请调整截止设置重新开放收分")
          tieDecision <- services.events.tables.qualification_orders.QualificationOrdersTable.findServiceGenerate(connection, id)
          snapshot = json(ranks.map(r=>Map("entryId"->r.entry.id,"total"->r.total.getOrElse(""))))
          resolved = tieDecision.filter(t=>readJson[io.circe.Json](t._1)==readJson[io.circe.Json](snapshot)).map(t=>readJson[List[String]](t._2))
          _ <- check(!hasQualifier || ranked.map(_.total).distinct.size == ranked.size || resolved.nonEmpty,409,"QUALIFICATION_TIE","排名赛存在同分，请在后台记录资格附加赛结果和并列排序")
          ordered = if hasQualifier then resolved.map(ids=>ids.flatMap(id=>es.find(_.id==id))).getOrElse(ranked.map(_.entry)) else es
          _ <- if hasQualifier then services.events.tables.qualifier_snapshots.QualifierSnapshotsTable.insertServiceGenerate(connection, id, json(ranks)).void else ().pure[IO]
          advance = if hasQualifier then e.rules.stages.head.advance else ordered.size
          selected = ordered.take(advance)
          rankingOnly = hasQualifier && e.rules.stages.size==1
          _ <- check(rankingOnly || selected.size >= 2,400,"INSUFFICIENT_QUALIFIERS","下一阶段至少两方晋级者")
          _ <- selected.zipWithIndex.traverse_((en,i) => services.events.tables.entries.EntriesTable.updateServiceGenerate(connection, i+1, en.id))
          _ <- if hasQualifier then services.events.tables.competition_stages.CompetitionStagesTable.insertServiceGenerate(connection, id, e.rules.stages.head.id, json(ordered.map(_.id)), json(ordered.zipWithIndex.map((en,index) => Placement(en.id,if resolved.nonEmpty then index+1 else ranks.find(_.entry.id==en.id).flatMap(_.rank).getOrElse(index+1),0,0)))).void else ().pure[IO]
          _ <- new RankingSupport(connection).close(e,"advanced")
          _ <- services.events.tables.teams.TeamsTable.updateServiceGenerate(connection, id)
          _ <- services.events.tables.events.EventsTable.updateServiceGenerate(connection, if rankingOnly then "completed" else "running", id)
          _ <- if rankingOnly then ().pure[IO] else competition.startTx(e,if hasQualifier then 1 else 0,selected.map(_.id))
          _ <- ReadAuditMessage(id,user.id,"stage.generate",s"确认 ${selected.size} 方参赛阵容；按已审海选名次或报名顺序定种子").plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
