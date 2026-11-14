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

final case class GetEventsByIdEntriesMessage(idKey: EventId, viewer: Option[User]) extends APIMessage[List[Entry]]:
  def plan(connection: Connection): IO[List[Entry]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        e <- GetEventsByIdMessage(id,viewer.map(_.id)).plan(connection); s <- IO.pure(viewer); es <- ReadEntriesMessage(id).plan(connection)
      yield es.filter(en => en.status == "accepted" || s.exists(v => v.id == e.ownerId || v.id == en.userId)).map(en => if s.exists(v => v.id == e.ownerId || v.id == en.userId) then en else en.copy(reason="")))
