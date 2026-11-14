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
final case class LoginMessage(input: Credentials) extends APIMessage[User]:
  def plan(connection: Connection): IO[User] = for
    _ <- IO.raiseUnless(input.password.length <= 256 && input.username.length <= 32)(AppError(400,ApiError("INVALID_CREDENTIALS","账号或密码格式无效")))
    row <- UsersTable.findTransport(connection,input.username.toLowerCase.trim)
    _ <- if row.isEmpty then Passwords.hash(input.password).void else IO.unit
    valid <- row.traverse(r => Passwords.verify(input.password,r._4)).map(_.contains(true))
    _ <- IO.raiseUnless(valid)(AppError(401,ApiError("BAD_CREDENTIALS","账号或密码不正确")))
    found <- row.liftTo[IO](AppError(401,ApiError("BAD_CREDENTIALS","账号或密码不正确")))
  yield User(found._1,found._2,found._3)
