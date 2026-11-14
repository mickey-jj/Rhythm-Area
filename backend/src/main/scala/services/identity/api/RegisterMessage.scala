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
final case class RegisterMessage(input: Credentials) extends APIMessage[User]:
  def plan(connection: Connection): IO[User] = for
    instance <- services.instance.api.GetInstanceMessage(None).plan(connection)
    _ <- IO.raiseUnless(instance.published)(AppError(409,ApiError("NOT_PUBLISHED","赛事尚未发布，暂未开放普通账号注册")))
    _ <- IO.raiseUnless(input.username.matches("[a-zA-Z0-9_-]{3,32}") && input.password.length>=10 && input.password.length<=256 && input.displayName.exists(n=>n.trim.nonEmpty && n.length<=50))(AppError(400,ApiError("INVALID_CREDENTIALS","账号 3–32 位英文数字，密码 10–256 位，昵称 1–50 字")))
    hash <- Passwords.hash(input.password)
    id <- NewIdMessage().plan(connection)
    user = User(id,input.username.toLowerCase,input.displayName.get.trim)
    inserted <- UsersTable.insertTransport(connection,user.id,user.username,user.displayName,hash)
    _ <- IO.raiseUnless(inserted==1)(AppError(409,ApiError("USERNAME_EXISTS","该账号已存在")))
  yield user
