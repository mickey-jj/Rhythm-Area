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

final case class PostEventsByIdQualifierOrderMessage(idKey: EventId, user: User, input: QualificationInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val in = input
    val result = {
      val id = idKey.value
      val service = new ServiceSupport(connection)
      import service.*
      val repo = new RepositorySupport(connection)
      import repo.*
      (for
          e <- ReadEventMessage(id,true).plan(connection); _ <- RequireEventOwnerMessage(e,user.id).plan(connection); _ <- requireVersion(e.version,in.expectedVersion)
          _ <- check(e.status=="registration" && in.reason.trim.nonEmpty,409,"INVALID_STATE","仅排名赛阶段可以记录同分判定依据")
          board <- new RankingSupport(connection).synchronize(e)
          all <- rankingsTx(e)
          rows=if board.exists(_.session.status=="closed") then all.filter(_.complete) else all
          _ <- check(rows.forall(_.complete) && in.order.distinct.size==rows.size && in.order.toSet==rows.map(_.entry.id).toSet,400,"INVALID_ORDER","需为完整有效成绩提供不重不漏的排序")
          ranks = in.order.map(id=>rows.find(_.entry.id==id).get.rank.get)
          _ <- check(ranks==ranks.sorted,400,"INVALID_ORDER","只能在同分组内调整，不能越过已确定名次")
          snapshot = json(all.map(r=>Map("entryId"->r.entry.id,"total"->r.total.getOrElse(""))))
          _ <- services.events.tables.qualification_orders.QualificationOrdersTable.insertServiceResolvequalifier(connection, id, snapshot, json(in.order), in.reason, user.id)
          _ <- ReadAuditMessage(id,user.id,"qualifier.tiebreak",in.reason+" · "+in.order.mkString(",")).plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
