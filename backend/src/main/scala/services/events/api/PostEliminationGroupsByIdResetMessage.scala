package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import io.circe.syntax.*
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*
import services.events.tables.elimination_groups.EliminationGroupsTable
import services.events.tables.attempts.AttemptsTable
import services.events.tables.competition_stages.CompetitionStagesTable
import services.events.tables.events.EventsTable
import services.identity.objects.User
import services.identity.api.RequireEventOwnerMessage
import services.system.api.APIMessage
final case class PostEliminationGroupsByIdResetMessage(idKey: EliminationGroupId,user: User,input: MatchResetInput) extends APIMessage[EliminationRoom]:
  def plan(connection: Connection): IO[EliminationRoom] =
    val repo=new RepositorySupport(connection)
    val support=new EliminationSupport(connection)
    val reset=new MatchResetSupport(connection)
    for
      initial <- support.read(idKey.value)
      e <- ReadEventMessage(initial.eventId,true).plan(connection)
      _ <- RequireEventOwnerMessage(e,user.id).plan(connection)
      g <- support.read(idKey.value)
      _ <- repo.requireVersion(g.version,input.expectedVersion)
      _ <- repo.check(g.scheduleState==ScheduleState.Current && Set("playing","completed").contains(g.status) && e.status!="archived",409,"GROUP_CLOSED","本轮尚未就位、已归档或属于历史赛程")
      _ <- repo.check(input.reason.trim.nonEmpty && input.reason.length<=2000,400,"REASON_REQUIRED","请填写重置原因")
      ids <- reset.followers(e,g.stageId,(0 until g.advance).map(i=>s"${g.key}-$i").toSet)
      _ <- reset.clearFollowers(ids,user.id,"主办重置上游晋级轮 · "+input.reason.trim)
      _ <- ReadAuditMessage(e.id,user.id,"group.reset",g.asJson.noSpaces+" · "+input.reason.trim).plan(connection)
      _ <- AttemptsTable.supersedeGroup(connection,g.id)
      next=g.copy(status="playing",placements=Nil,reason="",version=g.version+1)
      _ <- EliminationGroupsTable.save(connection,next)
      _ <- CompetitionStagesTable.updateOperationsReplaytx(connection,e.id,g.stageId)
      _ <- EventsTable.updateOperationsReplaytx(connection,e.id)
      _ <- new GroupClockSupport(connection).resetReady(next)
      result <- GetEliminationGroupsByIdMessage(idKey,Some(user.id)).plan(connection)
    yield result
