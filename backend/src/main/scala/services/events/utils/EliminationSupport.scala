package services.events.utils
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.api.*
import services.events.tables.elimination_groups.EliminationGroupsTable
import services.events.tables.attempts.AttemptsTable
import services.events.tables.attempt_items.AttemptItemsTable
import services.identity.api.NewIdMessage
import services.system.api.*

private[events] object EliminationSupport:
  private[events] def publicGroup(group: EliminationGroup): EliminationGroup =
    if group.status=="waiting" then group.copy(rules=group.rules.copy(playOrder=Nil,draft=Nil)) else group
  private[events] def standings(group: EliminationGroup, attempts: List[Attempt]): List[EliminationStanding] =
    val rows=group.participants.map { id =>
      val approved=attempts.filter(a=>a.entryId==id && a.status=="approved" && a.items.map(_.slotId)==group.charts.map(_.chart_key)).sortBy(-_.sequence).headOption
      val total=approved.map(_.items.flatMap(i=>Engine.decimal(i.value)).sum)
      (id,total,approved.map(_.items).getOrElse(Nil))
    }.sortBy((_,score,_)=>score.map(_*(if group.rules.metric.higherWins then -1 else 1)).getOrElse(BigDecimal("1e100")))
    rows.map((id,total,items)=>EliminationStanding(id,total.map(_.bigDecimal.stripTrailingZeros.toPlainString),total.map(value=>rows.indexWhere(_._2.contains(value))+1),items))

private[events] final class EliminationSupport(connection: Connection):
  private val repo=new RepositorySupport(connection)
  import repo.*
  private[events] def read(id: String): IO[EliminationGroup] =
    EliminationGroupsTable.find(connection,id).flatMap(_.liftTo[IO](AppError(404,ApiError("NOT_FOUND","多人晋级轮不存在"))))
  private[events] def attempts(id: String): IO[List[Attempt]] =
    AttemptsTable.groupAttempts(connection,id).flatMap(_.traverse((aid,entry,status,sequence)=>AttemptItemsTable.findRepositoryAttempts(connection,aid).map(items=>Attempt(aid,entry,status,sequence,items))))
  private[events] def activate(e: EventView, stage: Stage, outcomes: Map[String,Outcome]): IO[Unit] = for
    groups <- EliminationGroupsTable.list(connection,e.id)
    _ <- groups.filter(g=>g.stageId==stage.id && g.scheduleState==ScheduleState.Current && g.status=="waiting").traverse_ { g =>
      val sources=g.sources.map(Tournament.source(_,outcomes))
      if !sources.forall(_.nonEmpty) then IO.unit else for
        pool <- ReadPoolMessage(e.id).plan(connection)
        seed <- NewIdMessage().plan(connection)
        members=sources.flatten.flatten
        _ <- check(members.distinct.size==members.size && members.size>g.advance && members.size<g.advance*2,409,"INVALID_GROUP","多人晋级轮的来源人数不符")
        fixed=g.rules.playOrder.filter(_.source.startsWith("fixed:")).map(_.source.drop(6))
        pools=g.rules.draft.filter(s=>s.action=="pick" || s.action=="random" || s.action=="assign").map(_.pool).distinct
        eligible=pool.filter(c=> !fixed.contains(c.chart_key) && pools.exists(p=>Engine.inPool(c,p)))
        selected=TeamFormationSupport.shuffled(eligible,_.chart_key,seed).take(g.rules.playOrder.size-fixed.size)
        charts=g.rules.playOrder.zipWithIndex.flatMap { (slot,i) =>
          if slot.source.startsWith("fixed:") then pool.find(_.chart_key==slot.source.drop(6))
          else selected.lift(g.rules.playOrder.take(i).count(s=> !s.source.startsWith("fixed:")))
        }
        _ <- check(charts.nonEmpty && charts.size==g.rules.playOrder.size && charts.map(_.chart_key).distinct.size==charts.size,400,"GROUP_POOL_SHORTAGE","当前图池不足以安排共同演奏曲目")
        _ <- EliminationGroupsTable.save(connection,g.copy(participants=members,status="playing",charts=charts,version=g.version+1))
      yield ()
    }
  yield ()
