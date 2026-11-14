package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.TeamInput
import services.events.utils.*
import services.identity.objects.User
import services.system.api.*
final case class PostEventsByIdTeamsByTidJoinMessage(idKey: EventId, tid: String, user: User) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] = for
    e <- ReadEventMessage(idKey.value,true).plan(connection)
    rows <- services.events.tables.teams.TeamsTable.findTeamsViewstx(connection,e.id)
    team <- rows.find(_._1==tid).liftTo[IO](AppError(404,ApiError("NOT_FOUND","队伍不存在")))
    result <- PostEventsByIdTeamsJoinMessage(idKey,user,TeamInput("",Some(team._4))).plan(connection)
  yield result
