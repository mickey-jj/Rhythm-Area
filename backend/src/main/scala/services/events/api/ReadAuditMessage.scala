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

final case class ReadAuditMessage(eventKey: EventId, userId: String, action: String, detail: String) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] =
    val eventId = eventKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    services.events.tables.audit_logs.AuditLogsTable.insertRepositoryAudit(connection, eventId, userId, action, detail).void
