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
final case class PostEventsByIdTeamCandidatesMessage(idKey: EventId, user: User, input: TeamCandidateInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val support=new TeamFormationSupport(connection)
    val repo=new RepositorySupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- support.open(e)
      _ <- support.beforeFormation(e)
      _ <- repo.check(input.note.length<=300,400,"NOTE_TOO_LONG","选手简介最多 300 字")
      candidates <- TeamCandidatesTable.list(connection,e.id)
      _ <- repo.check(candidates.exists(_.user.id==user.id) || candidates.size<e.rules.capacity*e.rules.team.max,409,"POOL_FULL","候选名额已满")
      _ <- TeamCandidatesTable.join(connection,e.id,user.id,input.note.trim)
      _ <- ReadAuditMessage(e.id,user.id,"team.candidate","加入组队候选名单").plan(connection)
    yield Map("ok"->true)
