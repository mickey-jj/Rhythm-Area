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

final case class InstanceSetupMessage(c: Credentials) extends APIMessage[User]:
  def plan(connection: Connection): IO[User] =
    for
        expected <- IO.blocking(sys.env.get("AREA_SETUP_TOKEN").getOrElse {
          val path=SystemConfig.root.resolve(".local/setup-token")
          if Files.exists(path) then Files.readString(path).trim else ""
        })
        _ <- check(expected.length>=32 && java.security.MessageDigest.isEqual(expected.getBytes(java.nio.charset.StandardCharsets.UTF_8),c.setupToken.getOrElse("").getBytes(java.nio.charset.StandardCharsets.UTF_8)),403,"SETUP_TOKEN_REQUIRED","请提供部署者持有的初始化码")
        _ <- IO.raiseUnless(c.username.matches("[a-zA-Z0-9_-]{3,32}") && c.password.length >= 10 && c.password.length <= 256 && c.displayName.exists(n => n.trim.nonEmpty && n.length <= 50))(AppError(400,ApiError("INVALID_CREDENTIALS","账号 3–32 位英文数字；密码 10–256 位；昵称 1–50 字")))
        hash <- HashPasswordMessage(c.password).plan(connection)
        id <- NewIdMessage().plan(connection)
        user <- (for
          existing <- services.instance.tables.instance_settings.InstanceSettingsTable.findInstanceSetup(connection)
          _ <- check(existing.isEmpty,409,"ALREADY_INITIALIZED","本实例已完成主办初始化，请登录")
          count <- services.identity.tables.users.UsersTable.findInstanceSetup(connection)
          _ <- check(count == 0,409,"LEGACY_DATABASE","此数据库已有旧版账号。请使用新的独立实例数据库；旧数据不会自动迁移或删除")
          name = c.displayName.get.trim
          _ <- services.identity.tables.users.UsersTable.insertInstanceSetup(connection, id, c.username.toLowerCase, name, hash)
          _ <- services.instance.tables.instance_settings.InstanceSettingsTable.updateInstanceSetup(connection, id)
        yield User(id,c.username.toLowerCase,name))
    yield user
