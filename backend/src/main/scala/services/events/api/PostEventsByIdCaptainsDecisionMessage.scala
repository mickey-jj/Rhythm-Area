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
final case class PostEventsByIdCaptainsDecisionMessage(idKey: EventId, user: User, input: CaptainDecisionInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val support=new TeamFormationSupport(connection)
    val repo=new RepositorySupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- repo.check(e.ownerId==user.id,403,"FORBIDDEN","仅主办方可认定队长")
      _ <- support.open(e)
      _ <- support.beforeFormation(e)
      mode=TeamFormationSupport.captainMode(e.rules.team)
      _ <- repo.check(Set[CaptainSelection]("appointed","application")(mode) && Set[CaptainStatus]("approved","rejected")(input.decision),400,"CAPTAIN_MODE","请选择认定或报名审核模式，并使用通过或驳回操作")
      candidates <- TeamCandidatesTable.list(connection,e.id)
      candidate <- candidates.find(_.user.id==input.userId).liftTo[IO](AppError(404,ApiError("NOT_FOUND","选手未加入候选名单")))
      _ <- repo.check(candidate.teamId.isEmpty && (mode=="appointed" || candidate.captainStatus=="pending"),409,"CAPTAIN_NOT_PENDING","选手已组队或没有待审核申请")
      _ <- if input.decision=="approved" then support.makeCaptain(e,candidate.user,(candidate.user.displayName+"的队伍").take(50)) else TeamCandidatesTable.decision(connection,e.id,input.userId,"rejected").void
      _ <- ReadAuditMessage(e.id,user.id,"captain.decision",candidate.user.displayName+" "+input.decision).plan(connection)
    yield Map("ok"->true)
