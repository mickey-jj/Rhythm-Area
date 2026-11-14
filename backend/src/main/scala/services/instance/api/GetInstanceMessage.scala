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

final case class GetInstanceMessage(viewer: Option[String]) extends APIMessage[InstanceView]:
  def plan(connection: Connection): IO[InstanceView] =
    (for
        settings <- services.instance.tables.instance_settings.InstanceSettingsTable.findInstanceView(connection)
        (ownerId,eventId,appearance,demo) = settings
        e <- eventId.traverse(id => ReadEventMessage(id).plan(connection))
        isOwner = ownerId.exists(id => viewer.contains(id))
        judgeUser <- e.traverse(ev=>viewer.traverse(u=>services.identity.tables.judge_grants.JudgeGrantsTable.findInstanceView(connection, ev.id, u, ev.id, u))).map(_.flatten.contains(true))
        published = e.exists(_.status != "draft")
      yield InstanceView(ownerId.isEmpty,eventId.nonEmpty,published,isOwner,e.filter(_ => isOwner || published),if isOwner || published then readJson[Appearance](appearance) else Appearance.default,demo,judgeUser))
