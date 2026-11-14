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

final case class PostEventsByIdPublishMessage(idKey: EventId, user: User, input: VersionInput) extends APIMessage[EventView]:
  def plan(connection: Connection): IO[EventView] =
    val version = input.expectedVersion
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        e <- ReadEventMessage(id,true).plan(connection)
        _ <- RequireEventOwnerMessage(e,user.id).plan(connection)
        _ <- requireVersion(e.version,version)
        _ <- check(e.status == "draft",409,"INVALID_STATE","仅草稿可发布")
        charts <- ReadPoolMessage(id).plan(connection)
        validation = Engine.validate(e.rules,charts)
        _ <- check(validation.valid,400,"INVALID_RULES",validation.issues.map(i => s"${i.fieldPath}: ${i.message}").mkString("；"))
        _ <- services.events.tables.rule_revisions.RuleRevisionsTable.insertServicePublish(connection, id, e.version, json(e.rules), json(charts))
        _ <- services.events.tables.events.EventsTable.updateServicePublish(connection, id)
        _ <- ReadAuditMessage(id,user.id,"event.publish",s"发布规则与图池 v${e.version}").plan(connection)
        result <- ReadEventMessage(id).plan(connection)
        _ <- new RankingSupport(connection).synchronize(result)
      yield result)
