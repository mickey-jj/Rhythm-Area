package services.identity.api

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

final case class ReadSessionMessage(hash: String) extends APIMessage[Option[Session]]:
  def plan(connection: Connection): IO[Option[Session]] =
    services.identity.tables.sessions.SessionsTable.findRepositorySession(connection, hash).map(_.map((id,u,n,c) => Session(User(id,u,n),c)))
