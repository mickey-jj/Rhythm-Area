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

final case class InstanceLoadDemoMessage(user: User, players: List[DemoPlayer]) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] =
    for
        prepared <- players.traverse(p => HashPasswordMessage(p.password).plan(connection).map(h => (p,h)))
        _ <- (for
          settings <- services.instance.tables.instance_settings.InstanceSettingsTable.findInstanceLoaddemo(connection)
          _ <- check(settings._1.contains(user.id),403,"FORBIDDEN","需要本实例主办权限")
          eventId <- settings._2.liftTo[IO](AppError(409,ApiError("NO_EVENT","请先保存当前赛事草稿")))
          e <- ReadEventMessage(eventId,true).plan(connection)
          _ <- check(players.size<=e.rules.capacity && e.rules.entryMode=="solo",400,"DEMO_CAPACITY","当前示例人员只适合容量不少于 4 的个人赛")
          _ <- check(e.status == "draft" && !settings._3,409,"DEMO_NOT_ALLOWED","演示数据只能在未发布的空草稿中载入一次")
          users <- services.identity.tables.users.UsersTable.findInstanceLoaddemo(connection)
          entries <- services.events.tables.entries.EntriesTable.findInstanceLoaddemo(connection, eventId)
          _ <- check(users == 1 && entries == 0,409,"INSTANCE_NOT_EMPTY","本实例已有正式账号或参赛数据，不再允许注入演示人员")
          _ <- prepared.traverse_ { (p,hash) =>
            val id = s"demo-${p.username}"
            services.identity.tables.users.UsersTable.insertInstanceLoaddemo(connection, id, p.username, p.displayName, hash) *>
            services.events.tables.entries.EntriesTable.insertInstanceLoaddemo(connection, s"entry-${p.username}", eventId, id, p.displayName)
          }
          _ <- services.instance.tables.instance_settings.InstanceSettingsTable.updateInstanceLoaddemo(connection)
          _ <- services.events.tables.events.EventsTable.updateInstanceLoaddemo(connection, eventId)
          _ <- ReadAuditMessage(eventId,user.id,"instance.demo","主办明确选择载入虚构演示人员；未自动发布或生成赛程").plan(connection)
        yield ())
    yield ()
