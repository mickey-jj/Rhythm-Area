package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*
import services.identity.objects.User
import services.system.api.*
import services.events.tables.team_drafts.TeamDraftsTable
import services.events.tables.team_members.TeamMembersTable
final case class PostEventsByIdTeamDraftPickMessage(idKey: EventId, user: User, input: TeamPickInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val support=new TeamFormationSupport(connection)
    val repo=new RepositorySupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- support.open(e)
      _ <- repo.check(TeamFormationSupport.formation(e.rules.team)=="draft",409,"FORMATION_MODE","本赛事未采用队长轮选")
      board <- support.board(e,Some(user.id))
      draft <- board.draft.liftTo[IO](AppError(409,ApiError("DRAFT_NOT_STARTED","选人尚未开始")))
      _ <- repo.requireVersion(draft.version,input.expectedVersion)
      team <- board.teams.find(t=>draft.activeTeamId.contains(t.id)).liftTo[IO](AppError(409,ApiError("DRAFT_COMPLETE","统一选人已完成")))
      _ <- repo.check(team.captainId==user.id || e.ownerId==user.id,403,"NOT_YOUR_TURN","尚未轮到本队选人")
      _ <- repo.check(board.candidates.exists(c=>c.user.id==input.userId && c.teamId.isEmpty),409,"PLAYER_UNAVAILABLE","该选手已被选择或不在候选名单")
      _ <- TeamMembersTable.insertTeamsJoin(connection,team.id,e.id,input.userId)
      done=board.candidates.count(_.teamId.isEmpty)==1
      _ <- TeamDraftsTable.save(connection,e.id,draft.copy(status=if done then "completed" else "drafting",pickIndex=TeamFormationSupport.turnIndex(draft,board.teams,e.rules.team.max).getOrElse(draft.pickIndex)+1,version=draft.version+1,picks=draft.picks :+ TeamPick(input.userId,team.id,draft.picks.size+1),activeTeamId=None))
      _ <- ReadAuditMessage(e.id,user.id,"team.draft.pick",team.name+" 选择 "+input.userId).plan(connection)
    yield Map("ok"->true)
