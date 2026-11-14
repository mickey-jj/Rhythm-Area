package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.utils.*
import services.identity.api.NewIdMessage
import services.identity.objects.User
import services.system.api.*
final case class PostEventsByIdCaptainsDrawMessage(idKey: EventId, user: User) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val support=new TeamFormationSupport(connection)
    val repo=new RepositorySupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- repo.check(e.ownerId==user.id,403,"FORBIDDEN","仅主办方可抽取队长")
      _ <- support.open(e)
      _ <- support.beforeFormation(e)
      _ <- repo.check(TeamFormationSupport.captainMode(e.rules.team)=="random",409,"CAPTAIN_MODE","本赛事未采用随机队长")
      board <- support.board(e,None)
      count=TeamFormationSupport.captainCount(e)
      _ <- repo.check(board.teams.isEmpty && board.candidates.size>=count,409,"CAPTAIN_DRAW_CLOSED","已有队伍或候选人数不足，不可重新抽取")
      seed <- NewIdMessage().plan(connection)
      chosen=TeamFormationSupport.shuffled(board.candidates,_.user.id,seed).take(count)
      _ <- chosen.traverse_(c=>support.makeCaptain(e,c.user,(c.user.displayName+"的队伍").take(50)))
      _ <- ReadAuditMessage(e.id,user.id,"captain.draw",chosen.map(_.user.displayName).mkString("、")).plan(connection)
    yield Map("ok"->true)
