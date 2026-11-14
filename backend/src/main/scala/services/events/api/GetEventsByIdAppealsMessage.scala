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

final case class GetEventsByIdAppealsMessage(idKey: EventId, authenticatedUser: User, viewer: Option[User]) extends APIMessage[List[AppealView]]:
  def plan(connection: Connection): IO[List[AppealView]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    val operations = new OperationsSupport(connection)
    (for u <- IO.pure(authenticatedUser); e <- GetEventsByIdMessage(id,viewer.map(_.id)).plan(connection); rows <- operations.appealsTx(e,u.id) yield rows)
