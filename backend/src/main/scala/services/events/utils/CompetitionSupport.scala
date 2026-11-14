package services.events.utils

import cats.effect.{IO, Resource}
import cats.syntax.all.*
import java.sql.Connection
import java.nio.file.{Files, Path}
import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import services.system.api.*
import services.system.utils.*
import services.events.utils.*

private[events] final class CompetitionSupport(connection: Connection):
  private val repo = new RepositorySupport(connection)
  import repo.*
  private[events] def nodeId(eid: String, stage: String, key: String) = s"$eid-$stage-$key"
  private[events] def insertTx(e: EventView, stage: Stage, f: Fixture): IO[Unit] =
    val id = nodeId(e.id,stage.id,f.key)+s"-v${e.version}"
    val base = stage.effective(e.rules)
    val rules = base.copy(initialWinsA=Option.when(f.bracket=="final" && base.resolution.finalPolicy=="advantage")(1))
    services.events.tables.matches.MatchesTable.insertCompetitionInserttx(connection, id, e.id, f.round, f.ordinal, json(rules), stage.id, f.bracket, f.key, f.a, f.b).void
  private[events] def startTx(e: EventView, index: Int, participants: List[String], initialLosses: Map[String,Int] = Map.empty, carried: List[MatchSummary] = Nil): IO[Unit] =
    val stage = e.rules.stages(index)
    for
      _ <- services.events.tables.competition_stages.CompetitionStagesTable.insertCompetitionStarttx(connection, e.id, stage.id, index, stage.kind, json(participants))
      _ <- services.events.tables.competition_stages.CompetitionStagesTable.saveInitialLosses(connection,json(initialLosses),e.id,stage.id)
      plan = if stage.kind=="double" && initialLosses.isEmpty then FairDouble.plan(participants) else EliminationPlan(if stage.kind=="double" then RuleChanges.doubleFixtures(participants,initialLosses) else Tournament.stageFixtures(stage,participants),Nil)
      fixtures = plan.fixtures
      _ <- plan.groups.traverse_ { g =>
        services.events.tables.elimination_groups.EliminationGroupsTable.save(connection,services.events.objects.apiTypes.EliminationGroup(s"${e.id}-${stage.id}-${g.key}-v${e.version}",e.id,stage.id,stage.name,g.key,g.round,g.advance,g.sources,Nil,"waiting",Nil,stage.effective(e.rules),Nil,1,ScheduleState.Current,"",g.expectedParticipants)).void
      }
      _ <- fixtures.traverse_ { f =>
        val pair=Set(f.a.stripPrefix("entry:"),f.b.stripPrefix("entry:"))
        carried.find(m=>m.a.zip(m.b).exists((a,b)=>Set(a.id,b.id)==pair)) match
          case Some(m) => services.events.tables.matches.MatchesTable.attachCompleted(connection,stage.id,f.key,f.round,f.ordinal,m.id).void
          case None => insertTx(e,stage,f)
      }
      _ <- synchronizeTx(e,stage)
      state <- stateTx(e.id,stage.id)
      _ <- if state._2.values.forall(o=>Tournament.terminal(o.status)) then completeTx(e,stage,state._1,state._2) else ().pure[IO]
    yield ()
  private[events] def stateTx(eid: String, sid: String): IO[(List[Fixture],Map[String,Outcome])] =
    for
      rows <- services.events.tables.matches.MatchesTable.findCompetitionStatetx(connection, eid, sid)
      groups <- services.events.tables.elimination_groups.EliminationGroupsTable.list(connection,eid)
      virtual=groups.filter(g=>g.stageId==sid && g.scheduleState==ScheduleState.Current).map(FairDouble.state)
    yield (rows.map((k,r,o,b,a,z,_,_,_,_) => Fixture(k,r,o,b,a,z)) ++ virtual.flatMap(_._1),rows.map((k,_,_,_,_,_,a,b,w,s) => k -> Outcome(k,a,b,w,s)).toMap ++ virtual.flatMap(_._2))
  private[events] def synchronizeTx(e: EventView, stage: Stage): IO[Unit] = for
    state <- stateTx(e.id,stage.id)
    settled = Tournament.settle(state._1,state._2)
    _ <- new EliminationSupport(connection).activate(e,stage,settled)
    _ <- settled.values.toList.filter(o => state._2.get(o.key).forall(_ != o)).traverse_ { o =>
      services.events.tables.matches.MatchesTable.updateCompetitionSynchronizetx(connection, o.a, o.b, o.winner, o.status, e.id, stage.id, o.key).void
    }
    fixed = stage.effective(e.rules)
    _ <- if fixed.draft.isEmpty then
      services.events.tables.matches.MatchesTable.findCompetitionSynchronizetx(connection, e.id, stage.id).flatMap(_.traverse_(mid=>Engine.buildPlayOrder(fixed,DraftState(Nil)).zipWithIndex.traverse_((pair,i)=>services.events.tables.play_slots.PlaySlotsTable.insertCompetitionSynchronizetx(connection, mid, pair._1.id, pair._2, i+1))))
      else ().pure[IO]
    // A zero-step plan consists solely of fixed songs and becomes playable immediately.
    _ <- if stage.effective(e.rules).draft.isEmpty then services.events.tables.matches.MatchesTable.updateCompetitionSynchronizetx2(connection, e.id, stage.id).void else ().pure[IO]
  yield ()
  private[events] def finishTx(e: EventView, mid: String, winner: String): IO[Unit] = for
    sid <- services.events.tables.matches.MatchesTable.findCompetitionFinishtx(connection, mid)
    _ <- services.events.tables.matches.MatchesTable.updateCompetitionFinishtx(connection, winner, mid)
    stage <- e.rules.stages.find(_.id == sid).liftTo[IO](AppError(409,ApiError("LEGACY_SCHEDULE","请保留旧版赛程，新的赛制请在独立部署运行")))
    _ <- synchronizeTx(e,stage)
    state <- stateTx(e.id,sid)
    finalOne = state._2.get("F1")
    needsReset = stage.kind == "double" && stage.effective(e.rules).resolution.finalPolicy == "reset" && finalOne.exists(o => o.status == "finalized" && o.winner == o.b) && !state._2.contains("F2")
    _ <- if needsReset then
      val f = finalOne.get
      insertTx(e,stage,Fixture("F2",999,0,"reset","entry:"+f.a.get,"entry:"+f.b.get)) *> synchronizeTx(e,stage)
      else ().pure[IO]
    next <- stateTx(e.id,sid)
    _ <- if next._2.values.forall(o => Tournament.terminal(o.status)) then completeTx(e,stage,next._1,next._2) else ().pure[IO]
  yield ()
  private[events] def completeTx(e: EventView, stage: Stage, fs: List[Fixture], os: Map[String,Outcome]): IO[Unit] = for
    data <- services.events.tables.competition_stages.CompetitionStagesTable.findCompetitionCompletetx(connection, e.id, stage.id)
    placements = Tournament.placements(stage.kind,readJson[List[String]](data._1),fs,os,readJson[Map[String,Int]](data._3))
    _ <- services.events.tables.competition_stages.CompetitionStagesTable.updateCompetitionCompletetx(connection, json(placements), e.id, stage.id)
    finalTie = data._2==e.rules.stages.size-1 && placements.count(_.rank==1)>1
    _ <- if finalTie then services.events.tables.competition_stages.CompetitionStagesTable.updateCompetitionCompletetx2(connection, e.id, stage.id).void
      else if data._2 == e.rules.stages.size-1 then services.events.tables.events.EventsTable.updateCompetitionCompletetx(connection, e.id).void
      else advanceTx(e,stage,data._2,placements)
  yield ()
  private[events] def advanceTx(e: EventView, stage: Stage, index: Int, placements: List[Placement]): IO[Unit] =
    val ordered = placements.sortBy(_.rank)
    val selected = ordered.take(stage.advance)
    val boundaryTie = ordered.lift(stage.advance).exists(p => selected.lastOption.exists(_.rank == p.rank))
    if boundaryTie then services.events.tables.competition_stages.CompetitionStagesTable.updateCompetitionAdvancetx(connection, e.id, stage.id).void
    else startTx(e,index+1,selected.map(_.entryId))
  private[events] def resolveTx(userId: String, e: EventView, sid: String, in: QualificationInput): IO[Unit] = for
    _ <- RequireEventOwnerMessage(e,userId).plan(connection)
    _ <- requireVersion(e.version,in.expectedVersion)
    row <- services.events.tables.competition_stages.CompetitionStagesTable.findCompetitionResolvetx(connection, e.id, sid)
    _ <- check(row._1 == "qualification-tie" && in.reason.trim.nonEmpty,409,"INVALID_STATE","只可处理待定晋级，并记录附加赛或判定依据")
    placements = readJson[List[Placement]](row._3)
    _ <- check(in.order.distinct.size == placements.size && in.order.toSet == placements.map(_.entryId).toSet,400,"INVALID_ORDER","须包含当前阶段全部选手且不重复")
    ranks = in.order.map(id => placements.find(_.entryId == id).get.rank)
    _ <- check(ranks == ranks.sorted,400,"INVALID_ORDER","只能调整并列组内顺序，不能越过已确定名次")
    _ <- services.events.tables.competition_stages.CompetitionStagesTable.updateCompetitionResolvetx(connection, in.reason, e.id, sid)
    _ <- ReadAuditMessage(e.id,userId,"stage.qualification",in.reason+" · "+in.order.mkString(",")).plan(connection)
    reordered = in.order.zipWithIndex.map((id,i)=>placements.find(_.entryId==id).get.copy(rank=i+1))
    _ <- services.events.tables.competition_stages.CompetitionStagesTable.updateCompetitionResolvetx2(connection, json(reordered), e.id, sid)
    _ <- if row._2==e.rules.stages.size-1 then services.events.tables.events.EventsTable.updateCompetitionResolvetx(connection, e.id).void else startTx(e,row._2+1,in.order.take(e.rules.stages(row._2).advance))
  yield ()
  private[events] def viewsTx(e: EventView): IO[List[StageView]] =
    services.events.tables.competition_stages.CompetitionStagesTable.findCompetitionViewstx(connection, e.id).map(_.map((id,k,s,p,r) => StageView(id,e.rules.stages.find(_.id==id).map(_.name).getOrElse(id),k,s,readJson[List[String]](p),readJson[List[Placement]](r))))
