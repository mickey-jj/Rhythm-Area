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

final case class GetEventsByIdAuditMessage(idKey: EventId, authenticatedUser: User) extends APIMessage[List[Audit]]:
  def plan(connection: Connection): IO[List[Audit]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        u <- IO.pure(authenticatedUser); e <- ReadEventMessage(id).plan(connection); _ <- RequireEventOwnerMessage(e,u.id).plan(connection)
        logs <- services.events.tables.audit_logs.AuditLogsTable.findTransport(connection, id)
      yield logs)
