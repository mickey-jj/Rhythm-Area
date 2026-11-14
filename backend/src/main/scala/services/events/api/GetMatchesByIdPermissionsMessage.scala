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

final case class GetMatchesByIdPermissionsMessage(idKey: MatchId, authenticatedUser: User) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        u <- IO.pure(authenticatedUser); m <- GetMatchesByIdMessage(id,Some(u.id)).plan(connection); e <- ReadEventMessage(m.eventId).plan(connection); allowed <- IsJudgeMessage(e,u.id,Some(id)).plan(connection)
      yield Map("judge"->allowed))
