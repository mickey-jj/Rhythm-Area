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

final case class PostMatchesByIdLineupsMessage(idKey: MatchId, user: User, input: LineupInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val midKey = idKey
    val in = input
    val result = {
      val mid = midKey.value
      val repo = new RepositorySupport(connection)
      import repo.*
      (for
          m <- GetMatchesByIdMessage(mid,Some(user.id),true).plan(connection)
          en <- ReadEntryMessage(in.entryId).plan(connection)
          e <- ReadEventMessage(m.eventId).plan(connection)
          _ <- check(en.userId==user.id && (m.a.exists(_.id==en.id)||m.b.exists(_.id==en.id)) && m.rules.entryMode=="team" && m.status=="playing",403,"FORBIDDEN","仅本场本队队长可以设置阵容")
          _ <- requireVersion(m.version,in.expectedVersion)
          submitted <- services.events.tables.attempts.AttemptsTable.findTeamsLineup(connection, mid, en.id, m.generation)
          _ <- check(submitted==0,409,"FROZEN","本队已交分，阵容已冻结")
          members <- services.events.tables.team_members.TeamMembersTable.findTeamsLineup(connection, en.id)
          required = m.slots.filter(_.extraRound==m.extraRound).map(_.id)
          _ <- check(in.items.map(_.slotId).distinct.size==in.items.size && in.items.map(_.slotId).toSet==required.toSet,400,"INVALID_LINEUP","请为当前每首曲配置阵容")
          _ <- check(in.items.forall(i => i.userIds.distinct.size==m.rules.team.perChart && i.userIds.size==m.rules.team.perChart && i.userIds.forall(members.contains)),400,"INVALID_LINEUP","每曲上场人数必须相同，且只能使用冻结成员")
          appearances = in.items.flatMap(_.userIds).groupMapReduce(identity)(_ => 1)(_+_)
          _ <- check(appearances.values.forall(_<=m.rules.team.maxAppearances),400,"APPEARANCE_LIMIT","超过单组每人最多出场次数")
          _ <- services.events.tables.lineups.LineupsTable.deleteTeamsLineup(connection, mid, en.id)
          _ <- in.items.traverse_(i => i.userIds.traverse_(u => services.events.tables.lineups.LineupsTable.insertTeamsLineup(connection, mid, en.id, i.slotId, u)))
          _ <- services.events.tables.matches.MatchesTable.updateTeamsLineup(connection, mid)
          _ <- ReadAuditMessage(e.id,user.id,"team.lineup",mid+" · "+json(in.items)).plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
