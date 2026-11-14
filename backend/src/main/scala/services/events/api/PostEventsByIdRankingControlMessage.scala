package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.tables.ranking_sessions.RankingSessionsTable
import services.events.utils.*
import services.identity.objects.User
import services.identity.api.RequireEventOwnerMessage
import services.system.api.*
final case class PostEventsByIdRankingControlMessage(idKey: EventId, user: User, input: RankingControlInput) extends APIMessage[RankingBoard]:
  def plan(connection: Connection): IO[RankingBoard] =
    val repo=new RepositorySupport(connection)
    val support=new RankingSupport(connection)
    for
      e <- ReadEventMessage(idKey.value,true).plan(connection)
      _ <- RequireEventOwnerMessage(e,user.id).plan(connection)
      _ <- repo.check(e.status=="registration",409,"RANKING_CLOSED","本阶段已确认晋级，不能重新收分")
      board <- support.synchronize(e).flatMap(_.liftTo[IO](AppError(404,ApiError("NO_RANKING","本赛事没有排名赛阶段"))))
      s=board.session
      _ <- repo.requireVersion(s.version,input.expectedVersion)
      _ <- repo.check(input.action match
        case "start" => s.status=="waiting"
        case "close" => s.status=="open"
        case "reopen" => s.status=="closed",409,"INVALID_STATE","排名赛状态已变化，请刷新后重试")
      policy=RankingLogic.policy(e.rules,e.rules.stages.head)
      edited=if input.action=="close" then s.copy(status="closed",closedAt=Some(board.serverNow),stopReason=Some("manual")) else s.copy(status="open",startedAt=Some(board.serverNow),closedAt=None,stopReason=None,policy=policy)
      next=RankingLogic.progress(edited,policy,board.serverNow,RankingLogic.reached(e.rules,policy,board.rankings),e.status)
      _ <- repo.check(input.action=="close" || next.status=="open",409,"END_CONDITION_MET","截止条件已经满足，请先修改截止设置再开放")
      _ <- RankingSessionsTable.save(connection,next.copy(version=s.version+1))
      _ <- ReadAuditMessage(e.id,user.id,"ranking."+input.action,if input.action=="reopen" then "重新开放排名赛，保留已提交成绩" else if input.action=="start" then "开启排名赛" else "停止排名赛收分").plan(connection)
      result <- GetEventsByIdRankingBoardMessage(idKey,Some(user.id)).plan(connection)
    yield result
