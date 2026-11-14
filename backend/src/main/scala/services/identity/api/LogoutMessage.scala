package services.identity.api

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.*
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.identity.utils.Passwords
import services.identity.tables.users.UsersTable
import services.identity.tables.sessions.SessionsTable
final case class LogoutMessage(token: String) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] = SessionsTable.deleteTransport(connection,services.system.objects.TokenDigest(token)).void
