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

final case class PostAppealsByIdDecisionMessage(idKey: EventId, user: User, input: AppealDecision) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val in = input
    val result = {
      val id = idKey.value
      val repo = new RepositorySupport(connection)
      import repo.*
      val operations = new OperationsSupport(connection)
      (for
          row <- services.events.tables.appeals.AppealsTable.findOperationsDecide(connection, id)
          e <- ReadEventMessage(row._1,true).plan(connection); _ <- RequireJudgeMessage(e,user.id,Some(row._2)).plan(connection)
          _ <- check(e.status!="archived",409,"ARCHIVED_READ_ONLY","归档赛事不能处理申诉或变更赛果")
          _ <- check(row._3!=user.id && row._4=="pending" && Set("uphold","replay","reject").contains(in.decision) && in.reason.trim.nonEmpty,400,"INVALID_DECISION","禁止处理本人的申诉；决定和依据须完整")
          m <- GetMatchesByIdMessage(row._2,Some(user.id)).plan(connection)
          _ <- requireVersion(m.version,in.expectedVersion)
          _ <- if in.decision=="replay" then operations.replayTx(user,e,row._2,MatchDecision(m.version,in.reason,None)) else ().pure[IO]
          _ <- services.events.tables.appeals.AppealsTable.updateOperationsDecide(connection, in.decision+" · "+in.reason, id)
          _ <- ReadAuditMessage(e.id,user.id,"appeal.resolve",id+" · "+in.decision+" · "+in.reason).plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
