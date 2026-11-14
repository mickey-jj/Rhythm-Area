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

final case class GetEventsByIdAttemptsMessage(idKey: EventId, authenticatedUser: User, viewer: Option[User]) extends APIMessage[List[AttemptView]]:
  def plan(connection: Connection): IO[List[AttemptView]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        u <- IO.pure(authenticatedUser); e <- GetEventsByIdMessage(id,viewer.map(_.id)).plan(connection)
        rows <- ReadAttemptsMessage(id,Some(u.id),true).plan(connection)
        allowed <- rows.filterA(a => IsJudgeMessage(e,u.id,a.matchId).plan(connection).map(_ || a.submittedBy==u.id))
      yield allowed)
