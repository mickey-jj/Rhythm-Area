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

final case class PostEventsByIdJudgesMessage(idKey: EventId, user: User, input: JudgeInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val eidKey = idKey
    val in = input
    val result = {
      val eid = eidKey.value
      val repo = new RepositorySupport(connection)
      import repo.*
      (for
          e <- ReadEventMessage(eid,true).plan(connection)
          _ <- RequireEventOwnerMessage(e,user.id).plan(connection)
          u <- services.identity.tables.users.UsersTable.findOperationsGrant(connection, in.username.trim.toLowerCase).flatMap(_.liftTo[IO](AppError(404,ApiError("NOT_FOUND","请让该裁判先在本实例注册账号"))))
          _ <- in.matchId.traverse_(mid=>GetMatchesByIdMessage(mid,Some(user.id)).plan(connection).flatMap(m=>check(m.eventId==eid,400,"INVALID_MATCH","场次不属于当前赛事")))
          _ <- in.matchId match
            case Some(mid) => if in.remove then services.identity.tables.event_judges.EventJudgesTable.deleteOperationsGrant(connection, eid, u, mid).void else services.identity.tables.event_judges.EventJudgesTable.insertOperationsGrant(connection, eid, u, mid).void
            case None => if in.remove then services.identity.tables.judge_grants.JudgeGrantsTable.deleteOperationsGrant(connection, eid, u).void else services.identity.tables.judge_grants.JudgeGrantsTable.insertOperationsGrant(connection, eid, u).void
          _ <- ReadAuditMessage(eid,user.id,"judge.grant",s"${in.username} · ${in.matchId.getOrElse("全部比赛")} · ${if in.remove then "撤销" else "分配"}").plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
