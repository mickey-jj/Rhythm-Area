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

final case class ReadAttemptsMessage(idKey: EventId, viewer: Option[String], privileged: Boolean) extends APIMessage[List[AttemptView]]:
  def plan(connection: Connection): IO[List[AttemptView]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    services.events.tables.attempts.AttemptsTable.findRepositoryAttemptsRows(connection, id, privileged, viewer.getOrElse("")).flatMap(_.traverse { row =>
            val (a,e,m,en,n,u,s,seq,note,reason) = row
            for
              items <- services.events.tables.attempt_items.AttemptItemsTable.findRepositoryAttempts(connection, a)
              fid <- services.events.tables.attempts.AttemptsTable.findRepositoryAttempts(connection, a)
              groupId <- services.events.tables.attempts.AttemptsTable.groupId(connection,a)
              members <- services.events.tables.attempt_member_scores.AttemptMemberScoresTable.findAttempt(connection,a)
            yield AttemptView(a,e,m,en,n,u,s,seq,note,items,reason,fid,groupId,members)
          })
