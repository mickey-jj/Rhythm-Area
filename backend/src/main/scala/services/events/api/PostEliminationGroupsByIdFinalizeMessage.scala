package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*
import services.events.tables.elimination_groups.EliminationGroupsTable
import services.identity.objects.User
import services.identity.api.RequireJudgeMessage
import services.system.api.*
final case class PostEliminationGroupsByIdFinalizeMessage(idKey: EliminationGroupId, user: User, input: EliminationFinalizeInput) extends APIMessage[EliminationRoom]:
  def plan(connection: Connection): IO[EliminationRoom] =
    val repo=new RepositorySupport(connection)
    val support=new EliminationSupport(connection)
    val competition=new CompetitionSupport(connection)
    for
      found <- support.read(idKey.value)
      e <- ReadEventMessage(found.eventId,true).plan(connection)
      _ <- RequireJudgeMessage(e,user.id,None).plan(connection)
      group <- support.read(idKey.value)
      _ <- repo.requireVersion(group.version,input.expectedVersion)
      _ <- repo.check(e.status=="running" && group.scheduleState==ScheduleState.Current && group.status=="playing",409,"GROUP_CLOSED","该多人晋级轮当前不能结算")
      attempts <- support.attempts(group.id)
      _ <- repo.check(!attempts.exists(_.status=="pending"),409,"PENDING_REVIEW","仍有待审核成绩")
      standings=EliminationSupport.standings(group,attempts)
      _ <- repo.check(standings.size==group.participants.size && standings.forall(_.total.nonEmpty),409,"SCORES_INCOMPLETE","全部参赛方均须有完整、已通过审核的成绩")
      _ <- repo.check(input.order.distinct.size==standings.size && input.order.toSet==group.participants.toSet,400,"INVALID_ORDER","顺序须包含全部参赛方且不重复")
      ranks=input.order.flatMap(id=>standings.find(_.entryId==id).flatMap(_.rank))
      _ <- repo.check(ranks==ranks.sorted,400,"INVALID_ORDER","只能调整同分选手的顺序")
      _ <- repo.check(input.reason.length<=2000 && (ranks.distinct.size==ranks.size || input.reason.trim.nonEmpty),400,"TIE_REASON_REQUIRED","同分时须记录附加赛或抽签依据")
      _ <- EliminationGroupsTable.save(connection,group.copy(status="completed",placements=input.order,version=group.version+1,reason=input.reason.trim))
      stage <- e.rules.stages.find(_.id==group.stageId).liftTo[IO](AppError(409,ApiError("HISTORICAL_GROUP","请操作新赛程")))
      _ <- competition.synchronizeTx(e,stage)
      state <- competition.stateTx(e.id,stage.id)
      _ <- if state._2.values.forall(o=>Tournament.terminal(o.status)) then competition.completeTx(e,stage,state._1,state._2) else IO.unit
      _ <- ReadAuditMessage(e.id,user.id,"group.finalize",s"${group.participants.size} 进 ${group.advance} · ${input.order.mkString(",")} · ${input.reason}").plan(connection)
      result <- GetEliminationGroupsByIdMessage(idKey,Some(user.id)).plan(connection)
    yield result
