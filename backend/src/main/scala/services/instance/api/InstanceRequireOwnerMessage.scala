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

final case class InstanceRequireOwnerMessage(user: User) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] =
    (for
        ownerId <- services.instance.tables.instance_settings.InstanceSettingsTable.findInstanceRequireowner(connection)
        _ <- check(ownerId.contains(user.id),403,"FORBIDDEN","仅当前实例主办可配置赛事")
      yield ())
