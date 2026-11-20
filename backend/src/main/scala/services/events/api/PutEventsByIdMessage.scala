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

final case class PutEventsByIdMessage(idKey: EventId, user: User, input: EventInput) extends APIMessage[EventView]:
  def plan(connection: Connection): IO[EventView] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        _ <- services.instance.tables.instance_settings.InstanceSettingsTable.findServiceUpdate(connection)
        e <- ReadEventMessage(id,true).plan(connection)
        _ <- RequireEventOwnerMessage(e,user.id).plan(connection)
        _ <- check(e.status!="archived",409,"ARCHIVED_READ_ONLY","归档赛事只读，不能修改规则、赛程或公开赛果")
        _ <- requireVersion(e.version,input.expectedVersion.getOrElse(-1))
        previousCharts <- ReadPoolMessage(id).plan(connection)
        changed = RuleChanges.affectsSchedule(e.rules,input.rules,previousCharts,input.charts)
        _ <- EventValidateInputMessage(input).plan(connection)
        validation = Engine.validate(input.rules,input.charts)
        _ <- check(e.status=="draft" || validation.valid,400,"INVALID_RULES",validation.issues.map(i=>s"${i.fieldPath}: ${i.message}").mkString("；"))
        _ <- check(e.entryCount==0 || e.rules.entryMode==input.rules.entryMode,400,"ENTRY_MODE_MISMATCH","已有参赛记录，请保持个人或团队身份类型；仍可修改赛制与团队出场规则")
        teams <- new TeamsSupport(connection).viewsTx(id,None)
        formation <- services.events.tables.team_drafts.TeamDraftsTable.find(connection,id)
        _ <- check(teams.isEmpty || input.rules.entryMode=="team",400,"TEAM_MODE_MISMATCH","已有队伍，请保留团队参赛身份")
        _ <- check(teams.forall(t=>t.members.size<=input.rules.team.max && (t.entryId.isEmpty || t.members.size>=input.rules.team.min)),400,"TEAM_SIZE_MISMATCH","已组队成员须符合新的人数范围")
        _ <- check(!formation.exists(_.status=="drafting") || (input.rules.team.formation==e.rules.team.formation && input.rules.team.min==e.rules.team.min && input.rules.team.max==e.rules.team.max),409,"DRAFT_IN_PROGRESS","选人进行中，请先完成轮选再调整组队方式与人数范围")
        _ <- services.events.tables.events.EventsTable.updateServiceUpdate(connection, input.name.trim, input.tagline, input.description, json(input.rules), id)
        _ <- services.events.tables.draft_history.DraftHistoryTable.insertServiceUpdate(connection, id, e.version+1, json(input))
        updated <- ReadEventMessage(id).plan(connection)
        _ <- if e.status!="draft" && changed then RebuildEventScheduleMessage(e,updated,user.id).plan(connection) else IO.unit
        _ <- services.events.tables.matches.MatchesTable.snapshotCompletedCharts(connection,id)
        _ <- ReplacePoolMessage(id,input.charts).plan(connection)
        _ <- if e.status!="draft" then services.events.tables.rule_revisions.RuleRevisionsTable.insertServicePublish(connection,id,e.version+1,json(input.rules),json(input.charts)).void else IO.unit
        _ <- input.appearance.traverse_(a => services.instance.tables.instance_settings.InstanceSettingsTable.updateServiceUpdate(connection, json(a)))
        _ <- ReadAuditMessage(id,user.id,"event.update",s"保存赛事配置 v${e.version+1}").plan(connection)
        result <- ReadEventMessage(id).plan(connection)
        _ <- new RankingSupport(connection).synchronize(result)
      yield result)
