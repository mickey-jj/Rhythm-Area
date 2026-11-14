package services.events.api

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

final case class PostInstanceEventMessage(user: User, input: EventInput) extends APIMessage[EventView]:
  def plan(connection: Connection): IO[EventView] =
    val repo = new RepositorySupport(connection)
    import repo.*
    NewIdMessage().plan(connection).flatMap { id =>
        (for
          binding <- services.instance.tables.instance_settings.InstanceSettingsTable.findServiceCreate(connection)
          _ <- check(binding._1.contains(user.id),403,"FORBIDDEN","仅当前实例主办可以定义赛事")
          _ <- check(binding._2.isEmpty,409,"SINGLE_EVENT_ONLY","一份部署只承载一场赛事。请编辑当前赛事；另一场比赛应使用新部署")
          _ <- EventValidateInputMessage(input).plan(connection)
          _ <- AddPoolMetadataMessage(input.charts).plan(connection)
          _ <- services.events.tables.events.EventsTable.insertServiceCreate(connection, id, user.id, input.name.trim, input.tagline, input.description, json(input.rules))
          _ <- services.instance.tables.instance_settings.InstanceSettingsTable.updateServiceCreate(connection, id, json(input.appearance.getOrElse(Appearance.default)))
          _ <- services.events.tables.draft_history.DraftHistoryTable.insertServiceCreate(connection, id, json(input))
          result <- ReplacePoolMessage(id,input.charts).plan(connection) *> ReadAuditMessage(id,user.id,"event.create","定义本实例唯一赛事草稿").plan(connection) *> ReadEventMessage(id).plan(connection)
        yield result)
      }
