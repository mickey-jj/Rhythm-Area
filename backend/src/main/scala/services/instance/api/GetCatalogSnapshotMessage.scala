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

final case class GetCatalogSnapshotMessage(authenticatedUser: User) extends APIMessage[List[Chart]]:
  def plan(connection: Connection): IO[List[Chart]] =
    import Assets.*
    val root = SystemConfig.root
    (for u <- IO.pure(authenticatedUser); _ <- InstanceRequireOwnerMessage(u).plan(connection); charts <- catalog yield charts)
