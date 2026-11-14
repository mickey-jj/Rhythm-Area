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

final case class PostEventsByIdReopenMessage(idKey: EventId, user: User, input: VersionInput) extends APIMessage[EventView]:
  def plan(connection: Connection): IO[EventView] =
    val version = input.expectedVersion
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        e <- ReadEventMessage(id,true).plan(connection)
        _ <- RequireEventOwnerMessage(e,user.id).plan(connection)
        _ <- requireVersion(e.version,version)
        empty <- services.events.tables.entries.EntriesTable.findServiceReopen(connection, id, id, id)
        _ <- check(e.status=="registration" && empty,409,"FROZEN","只有尚无任何报名、场次和交分的赛事可撤回发布；已有参赛记录时请直接修改赛事配置")
        _ <- services.events.tables.events.EventsTable.updateServiceReopen(connection, id)
        _ <- ReadAuditMessage(id,user.id,"event.reopen","报名开始前撤回发布；保留已发布版本快照").plan(connection)
        result <- ReadEventMessage(id).plan(connection)
      yield result)
