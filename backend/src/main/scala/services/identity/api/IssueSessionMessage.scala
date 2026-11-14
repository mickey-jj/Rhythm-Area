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
final case class IssueSessionMessage(user: User) extends APIMessage[SessionGrant]:
  def plan(connection: Connection): IO[SessionGrant] = for
    token <- NewIdMessage().plan(connection)
    csrf <- NewIdMessage().plan(connection)
    _ <- SessionsTable.insertTransport(connection,services.system.objects.TokenDigest(token),user.id,csrf)
  yield SessionGrant(token,Session(user,csrf))
