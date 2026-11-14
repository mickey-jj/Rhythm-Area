package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*
import services.events.tables.group_clocks.GroupClocksTable
import services.identity.objects.User
import services.identity.api.RequireJudgeMessage
import services.system.api.APIMessage
final case class PostEliminationGroupsByIdClockMessage(idKey: EliminationGroupId,user: User,input: MatchClockInput) extends APIMessage[MatchClockBoard]:
  def plan(connection: Connection): IO[MatchClockBoard] =
    val repo=new RepositorySupport(connection)
    for
      initial <- new EliminationSupport(connection).read(idKey.value)
      e <- ReadEventMessage(initial.eventId,true).plan(connection)
      g <- new EliminationSupport(connection).read(idKey.value)
      m=GroupClockSupport.view(g)
      _ <- RequireJudgeMessage(e,user.id,None).plan(connection)
      _ <- repo.check(g.scheduleState==ScheduleState.Current && g.status=="playing",409,"CLOCK_UNAVAILABLE","当前晋级轮不能开赛或计时")
      b <- new GroupClockSupport(connection).board(g,true)
      s=b.clock
      _ <- repo.requireVersion(s.version,input.expectedVersion)
      _ <- repo.check(input.action match
        case "start" => s.status=="ready"
        case "pause" => s.status=="running"
        case "resume" => s.status=="paused"
        case "restart" => s.status=="expired" || s.status=="paused"
        case "next" => m.status=="playing" && Set("running","paused","expired").contains(s.status) && s.chartIndex+1<m.slots.count(_.extraRound==m.extraRound),409,"CLOCK_INVALID","计时状态已变化，请刷新")
      attempts <- ReadAttemptsMessage(e.id,Some(user.id),true).plan(connection)
      slot=m.slots.filter(_.extraRound==m.extraRound).lift(s.chartIndex)
      _ <- repo.check(input.action!="next" || g.participants.forall(en=>attempts.exists(a=>a.groupId.contains(g.id) && a.entryId==en && a.status=="approved" && slot.exists(s=>a.items.exists(_.slotId==s.id)))) && !attempts.exists(a=>a.groupId.contains(g.id) && a.status=="pending"),409,"CHART_PENDING","双方本曲成绩须审核完成，再开始下一曲")
      policy=if input.action=="pause" || input.action=="resume" then s.policy else e.rules.stages.find(_.id==m.stageId).flatMap(_.effective(e.rules).timing).getOrElse(s.policy)
      remaining=if input.action=="pause" then s.endsAt.map(_-b.serverNow).getOrElse(s.remainingMs).max(0L) else if input.action=="resume" then s.remainingMs else MatchClockLogic.duration(m,policy)
      index=if input.action=="next" then s.chartIndex+1 else s.chartIndex
      next=s.copy(policy=policy,phaseKey=MatchClockLogic.phase(m,index),chartIndex=index,status=if input.action=="pause" then "paused" else "running",remainingMs=remaining,endsAt=if input.action=="pause" then None else Some(b.serverNow+remaining),version=s.version+1)
      _ <- GroupClocksTable.save(connection,next)
      _ <- ReadAuditMessage(e.id,user.id,"match.clock."+input.action,s"${m.id} · ${next.phaseKey}").plan(connection)
      result <- new GroupClockSupport(connection).board(g,true)
    yield result
