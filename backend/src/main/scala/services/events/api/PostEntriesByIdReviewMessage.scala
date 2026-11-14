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

final case class PostEntriesByIdReviewMessage(idKey: EntryId, user: User, input: ReviewInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val result = {
      val id = idKey.value
      val repo = new RepositorySupport(connection)
      import repo.*
      (for
          en <- ReadEntryMessage(id).plan(connection)
          e <- ReadEventMessage(en.eventId,true).plan(connection)
          _ <- RequireEventOwnerMessage(e,user.id).plan(connection)
          _ <- check(e.status == "registration",409,"FROZEN","报名名单已冻结")
          _ <- check(en.status == "pending" && Set("accepted","rejected").contains(input.decision),409,"INVALID_STATE","报名已处理或决定无效")
          _ <- check(input.reason.trim.nonEmpty,400,"REASON_REQUIRED","请填写审核理由")
          _ <- services.events.tables.entries.EntriesTable.updateServiceReviewentry(connection, input.decision, input.reason, id)
          _ <- ReadAuditMessage(e.id,user.id,"entry.review",s"${en.displayName}: ${input.decision} · ${input.reason}").plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
