package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*
import services.identity.objects.User
import services.system.api.*
import services.events.tables.team_candidates.TeamCandidatesTable
final case class PostEventsByIdCaptainsApplyMessage(idKey: EventId, user: User, input: TeamCandidateInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val repo=new RepositorySupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- repo.check(TeamFormationSupport.captainMode(e.rules.team)=="application",409,"CAPTAIN_MODE","本赛事未开放队长申请")
      _ <- PostEventsByIdTeamCandidatesMessage(idKey,user,input).plan(connection)
      candidates <- TeamCandidatesTable.list(connection,e.id)
      candidate <- candidates.find(_.user.id==user.id).liftTo[IO](AppError(404,ApiError("NOT_FOUND","请先加入候选名单")))
      _ <- repo.check(candidate.teamId.isEmpty && Set[CaptainStatus]("none","rejected")(candidate.captainStatus),409,"CAPTAIN_PENDING","已加入队伍或已有队长申请")
      _ <- TeamCandidatesTable.decision(connection,e.id,user.id,"pending")
      _ <- ReadAuditMessage(e.id,user.id,"captain.apply","申请担任队长").plan(connection)
    yield Map("ok"->true)
