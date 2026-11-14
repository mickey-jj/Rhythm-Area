package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.utils.*
import services.identity.objects.User
import services.system.api.*
final case class PostEventsByIdTeamsLeaveMessage(idKey: EventId, user: User) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val support=new TeamFormationSupport(connection)
    val repo=new RepositorySupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- support.open(e)
      _ <- support.beforeFormation(e)
      _ <- repo.check(TeamFormationSupport.formation(e.rules.team)=="free",409,"FORMATION_MODE","统一组队不能自行退队")
      board <- support.board(e,Some(user.id))
      mine <- board.teams.find(_.members.exists(_.id==user.id)).liftTo[IO](AppError(404,ApiError("NOT_FOUND","尚未加入队伍")))
      _ <- repo.check(mine.captainId!=user.id && !mine.frozen && mine.entryId.isEmpty,409,"ROSTER_LOCKED","队长或已提交报名的成员不能退队")
      _ <- services.events.tables.team_members.TeamMembersTable.leave(connection,e.id,user.id)
      _ <- ReadAuditMessage(e.id,user.id,"team.leave",mine.name).plan(connection)
    yield Map("ok"->true)
