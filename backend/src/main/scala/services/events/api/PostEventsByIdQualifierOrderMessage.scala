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
      val repo = new RepositorySupport(connection)
      import repo.*
      (for
          e <- ReadEventMessage(id,true).plan(connection); _ <- RequireEventOwnerMessage(e,user.id).plan(connection); _ <- requireVersion(e.version,in.expectedVersion)
          _ <- check(e.status=="registration" && in.reason.trim.nonEmpty,409,"INVALID_STATE","仅排名赛阶段可以记录同分判定依据")
          board <- new RankingSupport(connection).synchronize(e)
            .flatMap(_.liftTo[IO](AppError(409,ApiError("NO_RANKING","本赛事没有排名赛阶段"))))
          snapshot = QualificationSupport.snapshot(board.rankings)
          _ <- check(in.expectedSnapshotKey.forall(_ == QualificationSupport.snapshotKey(snapshot)),409,"QUALIFICATION_CHANGED","有效成绩已更新，请按当前榜单重新记录同分判定")
          rows = if board.session.status == "closed" then board.rankings.filter(_.complete) else board.rankings
          _ <- check(rows.forall(_.complete) && QualificationSupport.validOrder(rows,in.order),400,"INVALID_ORDER","请完整排序所有有效成绩，只能在同分组内调整顺序")
          _ <- services.events.tables.qualification_orders.QualificationOrdersTable.insertServiceResolvequalifier(connection, id, snapshot.noSpaces, json(in.order), in.reason, user.id)
          _ <- ReadAuditMessage(id,user.id,"qualifier.tiebreak",in.reason+" · "+in.order.mkString(",")).plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
