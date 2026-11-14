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

final case class PostEventsByIdArchiveMessage(idKey: EventId, user: User, input: VersionInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        u <- IO.pure(user); in <- IO.pure(input)
        _ <- (for
          e <- ReadEventMessage(id,true).plan(connection); _ <- RequireEventOwnerMessage(e,u.id).plan(connection); _ <- requireVersion(e.version,in.expectedVersion)
          _ <- check(e.status == "completed",409,"INVALID_STATE","只有已结束的赛事可以归档")
          _ <- services.events.tables.events.EventsTable.updateTransport(connection, id)
          _ <- ReadAuditMessage(id,u.id,"event.archive","关闭普通流程并保留全部赛果和审核记录").plan(connection)
        yield ())
      yield Map("ok"->true))
