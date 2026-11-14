package services.instance.api

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


import services.instance.utils.InputValidation.*
import services.instance.utils.*

final case class GetInstanceExportMessage(authenticatedUser: User) extends APIMessage[EventTemplate]:
  def plan(connection: Connection): IO[EventTemplate] =
    (for
        u <- IO.pure(authenticatedUser)
        _ <- InstanceRequireOwnerMessage(u).plan(connection)
        state <- GetInstanceMessage(Some(u.id)).plan(connection)
        e <- state.event.liftTo[IO](AppError(409,ApiError("NO_EVENT","请先保存配置")))
        charts <- ReadPoolMessage(e.id).plan(connection)
      yield EventTemplate("rhythm-area-template",1,e.name,e.tagline,e.description,e.rules,charts,state.appearance))
