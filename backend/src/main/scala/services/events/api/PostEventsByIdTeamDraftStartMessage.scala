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
final case class PostEventsByIdTeamDraftStartMessage(idKey: EventId, user: User) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val support=new TeamFormationSupport(connection)
    val repo=new RepositorySupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- repo.check(e.ownerId==user.id,403,"FORBIDDEN","仅主办方可开始统一选人")
      board <- support.ready(e,"draft")
      seed <- NewIdMessage().plan(connection)
      order=TeamFormationSupport.shuffled(board.teams,_.id,seed).map(_.id)
      done=board.candidates.forall(_.teamId.nonEmpty)
      _ <- TeamDraftsTable.save(connection,e.id,TeamDraftView(if done then "completed" else "drafting",order,e.rules.team.draftOrder.getOrElse("snake"),0,1,Nil))
      _ <- ReadAuditMessage(e.id,user.id,"team.draft.start","抽签确定选人顺序："+order.mkString(",")).plan(connection)
    yield Map("ok"->true)
