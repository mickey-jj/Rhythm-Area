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

final case class PostMatchesByIdAppealsMessage(idKey: MatchId, user: User, input: AppealInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val midKey = idKey
    val in = input
    val result = {
      val mid = midKey.value
      val repo = new RepositorySupport(connection)
      import repo.*
      (for
          m <- GetMatchesByIdMessage(mid,Some(user.id)).plan(connection); e <- ReadEventMessage(m.eventId,true).plan(connection)
          _ <- check(e.status!="archived" && List(m.a,m.b).flatten.exists(_.userId==user.id),403,"FORBIDDEN","本场参赛方可在归档前提出申诉")
          _ <- check(in.reason.trim.nonEmpty && in.reason.length<=2000,400,"REASON_REQUIRED","请填写事实与申诉理由")
          n <- services.events.tables.appeals.AppealsTable.findOperationsAppeal(connection, mid, user.id)
          _ <- check(n==0,409,"DUPLICATE_APPEAL","已有待处理申诉")
          _ <- services.events.tables.appeals.AppealsTable.insertOperationsAppeal(connection, e.id, mid, user.id, in.reason)
          _ <- ReadAuditMessage(e.id,user.id,"appeal.submit",mid+" · 提出申诉").plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
