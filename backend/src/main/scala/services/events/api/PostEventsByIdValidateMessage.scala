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

final case class PostEventsByIdValidateMessage(idKey: EventId, user: User) extends APIMessage[Validation]:
  def plan(connection: Connection): IO[Validation] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        u <- IO.pure(user); e <- ReadEventMessage(id).plan(connection); _ <- RequireEventOwnerMessage(e,u.id).plan(connection); charts <- ReadPoolMessage(id).plan(connection)
      yield Engine.validate(e.rules,charts))
