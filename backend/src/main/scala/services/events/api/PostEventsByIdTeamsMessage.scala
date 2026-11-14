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

final case class PostEventsByIdTeamsMessage(idKey: EventId, user: User, input: TeamInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val support=new TeamFormationSupport(connection)
    val repo=new RepositorySupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- support.open(e)
      _ <- support.beforeFormation(e)
      _ <- repo.check(TeamFormationSupport.captainMode(e.rules.team)=="free",409,"CAPTAIN_MODE","队长由赛事认定，请先前往组队大厅")
      _ <- repo.check(input.name.trim.nonEmpty && input.name.length<=50,400,"INVALID_NAME","队名为 1–50 字")
      _ <- support.makeCaptain(e,user,input.name.trim)
      _ <- ReadAuditMessage(e.id,user.id,"team.create",input.name.trim).plan(connection)
    yield Map("ok"->true)
