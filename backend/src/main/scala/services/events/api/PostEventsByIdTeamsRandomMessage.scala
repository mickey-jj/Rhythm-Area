package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*
import services.identity.api.NewIdMessage
import services.identity.objects.User
import services.system.api.*
import services.events.tables.team_drafts.TeamDraftsTable
import services.events.tables.team_members.TeamMembersTable
final case class PostEventsByIdTeamsRandomMessage(idKey: EventId, user: User) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val support=new TeamFormationSupport(connection)
    val repo=new RepositorySupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- repo.check(e.ownerId==user.id,403,"FORBIDDEN","仅主办方可随机组队")
      board <- support.ready(e,"random")
      seed <- NewIdMessage().plan(connection)
      order=TeamFormationSupport.shuffled(board.teams,_.id,seed)
      players=TeamFormationSupport.shuffled(board.candidates.filter(_.teamId.isEmpty),_.user.id,seed)
      picks=players.zipWithIndex.map((c,i)=>TeamPick(c.user.id,order(i%order.size).id,i+1))
      _ <- picks.traverse_(p=>TeamMembersTable.insertTeamsJoin(connection,p.teamId,e.id,p.userId).void)
      _ <- TeamDraftsTable.save(connection,e.id,TeamDraftView("completed",order.map(_.id),"round-robin",picks.size,1,picks))
      _ <- ReadAuditMessage(e.id,user.id,"team.random","随机均衡组队完成").plan(connection)
    yield Map("ok"->true)
