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

final case class PostEventsByIdEntriesMessage(idKey: EventId, user: User, input: EntryInput) extends APIMessage[Entry]:
  def plan(connection: Connection): IO[Entry] =
    val name = input.displayName
    val id = idKey.value
    val service = new ServiceSupport(connection)
    import service.*
    val repo = new RepositorySupport(connection)
    import repo.*
    val teams = new TeamsSupport(connection)
    NewIdMessage().plan(connection).flatMap { entryId => (for
        e <- ReadEventMessage(id,true).plan(connection)
        _ <- check(e.status == "registration",409,"REGISTRATION_CLOSED","当前未开放报名")
        _ <- withinWindow(e,"registration")
        _ <- if e.rules.entryMode=="team" then
          for
            formation <- services.events.tables.team_drafts.TeamDraftsTable.find(connection,id)
            _ <- check(TeamFormationSupport.formation(e.rules.team)=="free" || formation.exists(_.status=="completed"),409,"FORMATION_INCOMPLETE","统一组队尚未完成")
            row <- services.events.tables.teams.TeamsTable.findServiceRegister(connection, id, user.id)
            _ <- check(row.exists((_,n)=>n>=e.rules.team.min && n<=e.rules.team.max),400,"INVALID_TEAM","队长请先建立队伍，并使成员数符合配置")
          yield ()
          else ().pure[IO]
        _ <- check(name.trim.nonEmpty && name.length <= 50,400,"INVALID_NAME","参赛昵称须为 1–50 字")
        existing <- services.events.tables.entries.EntriesTable.findServiceRegister(connection, id, user.id)
        _ <- check(existing == 0,409,"DUPLICATE_ENTRY","你已报名本赛事")
        count <- services.events.tables.entries.EntriesTable.findServiceRegister2(connection, id)
        _ <- check(count < e.rules.capacity,409,"CAPACITY_FULL","报名名额已满")
        _ <- services.events.tables.entries.EntriesTable.insertServiceRegister(connection, entryId, id, user.id, name.trim)
        result <- services.events.tables.entries.EntriesTable.findServiceRegister3(connection, id, user.id)
        _ <- if e.rules.entryMode=="team" then services.events.tables.teams.TeamsTable.updateServiceRegister(connection, result.id, id, user.id).void else ().pure[IO]
        _ <- ReadAuditMessage(id,user.id,"entry.submit",s"${name.trim} 提交报名").plan(connection)
      yield result) }
