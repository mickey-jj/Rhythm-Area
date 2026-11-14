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

final case class PostEventsByIdTeamsJoinMessage(idKey: EventId, user: User, input: TeamInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val eidKey = idKey
    val code = input.code.getOrElse("")
    val result = {
      val eid = eidKey.value
      val repo = new RepositorySupport(connection)
      import repo.*
      val teams = new TeamsSupport(connection)
      (for
          e <- ReadEventMessage(eid,true).plan(connection)
          _ <- new TeamFormationSupport(connection).open(e)
          _ <- check(TeamFormationSupport.formation(e.rules.team)=="free",409,"FORMATION_MODE","本赛事由统一组队分配成员，请加入候选名单")
          _ <- new TeamFormationSupport(connection).beforeFormation(e)
          team <- services.events.tables.teams.TeamsTable.findTeamsJoin(connection, eid, code).flatMap(_.liftTo[IO](AppError(404,ApiError("NOT_FOUND","邀请码无效"))))
          _ <- check(!team._2 && team._3.isEmpty,409,"FROZEN","队伍已提交报名，名单不能更改")
          n <- services.events.tables.team_members.TeamMembersTable.findTeamsJoin(connection, eid, user.id)
          count <- services.events.tables.team_members.TeamMembersTable.findTeamsJoin2(connection, team._1)
          _ <- check(n==0 && count<e.rules.team.max,409,"TEAM_FULL","已加入其他队伍或当前队伍已满")
          _ <- services.events.tables.team_members.TeamMembersTable.insertTeamsJoin(connection, team._1, eid, user.id)
          _ <- services.events.tables.team_candidates.TeamCandidatesTable.ensure(connection,eid,user.id)
          _ <- ReadAuditMessage(eid,user.id,"team.join","加入队伍 "+team._1).plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
