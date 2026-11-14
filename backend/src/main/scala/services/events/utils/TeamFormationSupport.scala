package services.events.utils
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.api.*
import services.system.api.*
import services.identity.api.NewIdMessage
import services.identity.objects.User
import services.events.tables.team_candidates.TeamCandidatesTable
import services.events.tables.team_drafts.TeamDraftsTable
import services.events.tables.teams.TeamsTable
import services.events.tables.team_members.TeamMembersTable

private[events] object TeamFormationSupport:
  private[events] def captainMode(p: TeamPolicy): CaptainSelection = p.captainSelection.getOrElse("free")
  private[events] def formation(p: TeamPolicy): TeamFormation = p.formation.getOrElse("free")
  private[events] def captainCount(e: EventView): Int = e.rules.team.captainCount.getOrElse(e.rules.capacity.min(2))
  private[events] def turnIndex(draft: TeamDraftView, teams: List[TeamView], maximum: Int): Option[Int] =
    val n=draft.teamOrder.size
    def at(index: Int): String =
      val offset=index%n
      draft.teamOrder(if draft.order=="snake" && (index/n)%2==1 then n-1-offset else offset)
    Option.when(draft.status=="drafting" && n>0)((draft.pickIndex until draft.pickIndex+n*2).find(i=>teams.find(_.id==at(i)).exists(_.members.size<maximum))).flatten
  private[events] def turn(draft: TeamDraftView, teams: List[TeamView], maximum: Int): Option[String] =
    turnIndex(draft,teams,maximum).map { index =>
      val n=draft.teamOrder.size
      draft.teamOrder(if draft.order=="snake" && (index/n)%2==1 then n-1-index%n else index%n)
    }
  private[events] def shuffled[A](values: List[A], key: A=>String, seed: String): List[A] =
    values.sortBy(a=>services.system.objects.TokenDigest(seed+":"+key(a)))

private[events] final class TeamFormationSupport(connection: Connection):
  private val repo=new RepositorySupport(connection)
  import repo.*
  private[events] def open(e: EventView): IO[Unit] =
    check(e.status=="registration" && e.rules.entryMode=="team",409,"TEAM_CLOSED","当前不在团队组队期") *> new ServiceSupport(connection).withinWindow(e,"registration")
  private[events] def beforeFormation(e: EventView): IO[Unit] =
    TeamDraftsTable.find(connection,e.id).flatMap(d=>check(d.isEmpty,409,"FORMATION_STARTED","统一组队已经开始，候选名单不再更改"))
  private[events] def board(e: EventView, viewer: Option[String]): IO[TeamFormationView] = for
    teams <- new TeamsSupport(connection).viewsTx(e.id,viewer)
    candidates <- TeamCandidatesTable.list(connection,e.id)
    draft <- TeamDraftsTable.find(connection,e.id)
  yield TeamFormationView(teams,candidates,draft.map(d=>d.copy(activeTeamId=TeamFormationSupport.turn(d,teams,e.rules.team.max))))
  private[events] def makeCaptain(e: EventView, candidate: User, name: String): IO[Unit] = for
    teams <- new TeamsSupport(connection).viewsTx(e.id,None)
    count <- TeamMembersTable.findTeamsCreate(connection,e.id,candidate.id)
    _ <- check(count==0,409,"DUPLICATE_MEMBER","该选手已加入队伍")
    managed=TeamFormationSupport.captainMode(e.rules.team)!="free" || TeamFormationSupport.formation(e.rules.team)!="free"
    _ <- check(teams.size<e.rules.capacity && (!managed || teams.size<TeamFormationSupport.captainCount(e)),409,"CAPTAIN_FULL","队长名额已满")
    id <- NewIdMessage().plan(connection)
    _ <- TeamsTable.insertTeamsCreate(connection,id,e.id,candidate.id,name,id.take(12))
    _ <- TeamMembersTable.insertTeamsCreate(connection,id,e.id,candidate.id)
    _ <- TeamCandidatesTable.ensure(connection,e.id,candidate.id)
    _ <- TeamCandidatesTable.decision(connection,e.id,candidate.id,"approved")
  yield ()
  private[events] def ready(e: EventView, mode: TeamFormation): IO[TeamFormationView] = for
    _ <- open(e)
    _ <- beforeFormation(e)
    _ <- check(TeamFormationSupport.formation(e.rules.team)==mode,409,"FORMATION_MODE","组队方式与赛事配置不符")
    board <- board(e,None)
    _ <- check(board.teams.size==TeamFormationSupport.captainCount(e) && board.teams.forall(t=>t.members.size==1 && !t.frozen && t.entryId.isEmpty),409,"CAPTAINS_NOT_READY","请先确定全部队长，且各队仅保留队长")
    n=board.candidates.size
    _ <- check(n>=board.teams.size*e.rules.team.min && n<=board.teams.size*e.rules.team.max,409,"POOL_SIZE","候选人数须满足所有队伍的人数上下限")
    _ <- check(board.teams.forall(t=>board.candidates.exists(_.user.id==t.captainId)),409,"CAPTAINS_NOT_READY","队长须加入候选名单")
  yield board
