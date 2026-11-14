package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.EventView
import services.events.tables.attempts.AttemptsTable
import services.events.tables.competition_stages.CompetitionStagesTable
import services.events.tables.matches.MatchesTable
import services.events.tables.match_history.MatchHistoryTable
import services.events.utils.{CompetitionSupport, RepositorySupport, RuleChanges, Tournament}
import services.system.api.APIMessage

final case class RebuildEventScheduleMessage(before: EventView, updated: EventView, userId: String) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] =
    val repo=new RepositorySupport(connection)
    import repo.*
    val competition=new CompetitionSupport(connection)
    for
      source <- CompetitionStagesTable.findRebuildSource(connection,before.id)
      schedule <- ReadScheduleMessage(before).plan(connection).map(_.filter(_.scheduleState==ScheduleState.Current))
      _ <- schedule.traverse_(m=>MatchHistoryTable.insertOperationsReplaytx(connection,m.id,m.generation,m.id,m.id,m.id,s"赛制调整 v${updated.version}",userId,m.id).void)
      _ <- schedule.filterNot(m=>Tournament.terminal(m.status)).traverse_(m=>AttemptsTable.updateOperationsReplaytx(connection,m.id).void)
      state <- source.traverse(s=>competition.stateTx(before.id,s._1))
      losses = source.zip(state).map((s,st)=>RuleChanges.losses(st._2,readJson[Map[String,Int]](s._5))).getOrElse(Map.empty[String,Int])
      remaining = source.map(s=>RuleChanges.remaining(s._3,readJson[List[String]](s._4),losses)).getOrElse(Nil)
      index = source.map(s=>updated.rules.stages.indexWhere(_.id==s._1)).filter(_>=0).getOrElse(source.map(s=>math.min(s._2,updated.rules.stages.size-1)).getOrElse(0))
      _ <- check(source.isEmpty || remaining.nonEmpty,400,"NO_REMAINING_ENTRIES","没有可继续参赛的选手")
      _ <- check(source.isEmpty || updated.rules.stages(index).kind!="ranking",400,"INVALID_LIVE_STAGE","重排正赛请选择淘汰赛或循环赛；已完成海选不重复收分")
      _ <- MatchesTable.archiveSchedule(connection,before.id)
      _ <- AttemptsTable.supersedeGroups(connection,before.id)
      _ <- services.events.tables.elimination_groups.EliminationGroupsTable.archive(connection,before.id)
      _ <- source.traverse_ { s =>
        val target=updated.rules.stages(index)
        val carried=if s._3=="round-robin" && target.kind=="round-robin" then schedule.filter(m=>m.stageId==s._1 && m.status=="finalized") else Nil
        val initial=if s._3=="double" && target.kind=="double" then losses.filter((id,n)=>remaining.contains(id) && n>0) else Map.empty[String,Int]
        CompetitionStagesTable.deleteForRebuild(connection,before.id,math.min(index,s._2),target.id) *>
          competition.startTx(updated,index,remaining,initial,carried)
      }
      _ <- ReadAuditMessage(before.id,userId,"schedule.rebuild",s"按新赛制重排；保留 ${schedule.count(_.status=="finalized")} 场已完成记录").plan(connection)
    yield ()
