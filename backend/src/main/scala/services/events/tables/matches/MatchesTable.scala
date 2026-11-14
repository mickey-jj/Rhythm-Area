package services.events.tables.matches

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
import org.typelevel.doobie.implicits.*

object MatchesTable:
  private val findRepositoryScheduleSql = """select id,round,ordinal,a_id,b_id,winner_id,status,version,extra_round,stage_id,bracket,generation,schedule_state,rules::text from matches where event_id=? order by stage_id,case bracket when 'winners' then 1 when 'losers' then 2 when 'final' then 3 when 'reset' then 4 else 5 end,round,ordinal,id"""
  def findRepositorySchedule(connection: Connection, eventId: String): IO[List[(String,Int,Int,Option[String],Option[String],Option[String],MatchStatus,Int,Int,String,BracketKind,Int,ScheduleState,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,Int,Int,Option[String],Option[String],Option[String],MatchStatus,Int,Int,String,BracketKind,Int,ScheduleState,String)](findRepositoryScheduleSql).to[List](eventId))

  private val findRepositoryMatchviewSql = """select id,event_id,round,ordinal,a_id,b_id,winner_id,status,version,extra_round,rules::text from matches where id=? for update"""
  def findRepositoryMatchview(connection: Connection, id: String): IO[Option[(String,String,Int,Int,Option[String],Option[String],Option[String],MatchStatus,Int,Int,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,Int,Int,Option[String],Option[String],Option[String],MatchStatus,Int,Int,String)](findRepositoryMatchviewSql).option(id))

  private val findRepositoryMatchview2Sql = """select id,event_id,round,ordinal,a_id,b_id,winner_id,status,version,extra_round,rules::text from matches where id=?"""
  def findRepositoryMatchview2(connection: Connection, id: String): IO[Option[(String,String,Int,Int,Option[String],Option[String],Option[String],MatchStatus,Int,Int,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,Int,Int,Option[String],Option[String],Option[String],MatchStatus,Int,Int,String)](findRepositoryMatchview2Sql).option(id))

  private val findRepositoryMatchview3Sql = """select stage_id,bracket,generation,schedule_state from matches where id=?"""
  def findRepositoryMatchview3(connection: Connection, id: String): IO[(String,BracketKind,Int,ScheduleState)] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,BracketKind,Int,ScheduleState)](findRepositoryMatchview3Sql).unique(id))

  private val updateServiceDraftSql = """update matches set version=version+1,status=? where id=?"""
  def updateServiceDraft(connection: Connection, status: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateServiceDraftSql).run((status,id)))

  private val updateServiceRevealSql = """update matches set status='playing',version=version+1 where id=?"""
  def updateServiceReveal(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateServiceRevealSql).run(id))

  private val findServiceSubmitSql = """select generation from matches where id=?"""
  def findServiceSubmit(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Int](findServiceSubmitSql).unique(id))

  private val updateServiceFinalizematchSql = """update matches set extra_round=extra_round+1,version=version+1,status=? where id=?"""
  def updateServiceFinalizematch(connection: Connection, status: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateServiceFinalizematchSql).run((status,id)))

  private val updateTeamsLineupSql = """update matches set version=version+1 where id=?"""
  def updateTeamsLineup(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateTeamsLineupSql).run(id))

  private val findOperationsReplaytxSql = """select node_key from matches where id=?"""
  def findOperationsReplaytx(connection: Connection, id: String): IO[String] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findOperationsReplaytxSql).unique(id))

  private val findOperationsReplaytx2Sql = """select id,node_key from matches where event_id=? and stage_id=? and schedule_state='current' and node_key is not null"""
  def findOperationsReplaytx2(connection: Connection, eventId: String, stageId: String): IO[List[(String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),(String,String)](findOperationsReplaytx2Sql).to[List]((eventId,stageId)))

  private val hasActiveProgressSql = """select m.status='finalized' or exists(select 1 from draft_actions d where d.match_id=m.id) or exists(select 1 from attempts a where a.match_id=m.id and a.status<>'superseded') or (m.status in ('drafting','playing','awaiting-reveal') and exists(select 1 from match_clocks c where c.match_id=m.id and c.state_json->>'status'<>'ready')) from matches m where m.id=?"""
  def hasActiveProgress(connection: Connection, id: String): IO[Boolean] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Boolean](hasActiveProgressSql).unique(id))

  private val prepareFixedMatchSql = "update matches set status='playing',version=version+1 where id=?"
  def prepareFixedMatch(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](prepareFixedMatchSql).run(id))

  private val retireResetFinalSql = "update matches set status='cancelled',schedule_state='historical',node_key=null,version=version+1 where id=?"
  def retireResetFinal(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](retireResetFinalSql).run(id))

  private val updateOperationsReplaytxSql = """update matches set a_id=null,b_id=null,winner_id=null,status='waiting',extra_round=0,generation=generation+1,version=version+1 where id=?"""
  def updateOperationsReplaytx(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateOperationsReplaytxSql).run(id))

  private val updateOperationsReplaytx2Sql = """update matches set status='drafting',winner_id=null,extra_round=0,generation=generation+1,version=version+1 where id=?"""
  def updateOperationsReplaytx2(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateOperationsReplaytx2Sql).run(id))

  private val insertCompetitionInserttxSql = """insert into matches(id,event_id,round,ordinal,status,rules,stage_id,bracket,node_key,source_a,source_b)
      values(?,?,?,?,'waiting',?::jsonb,?,?,?,?,?)"""
  def insertCompetitionInserttx(connection: Connection, id: String, eventId: String, round: Int, ordinal: Int, rules: String, stageId: String, bracket: String, nodeKey: String, sourceA: String, sourceB: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,Int,Int,String,String,String,String,String,String)](insertCompetitionInserttxSql).run((id,eventId,round,ordinal,rules,stageId,bracket,nodeKey,sourceA,sourceB)))

  private val findCompetitionStatetxSql = """select node_key,round,ordinal,bracket,source_a,source_b,a_id,b_id,winner_id,status from matches where event_id=? and stage_id=? and node_key is not null order by round,ordinal"""
  def findCompetitionStatetx(connection: Connection, eventId: String, stageId: String): IO[List[(String,Int,Int,BracketKind,String,String,Option[String],Option[String],Option[String],MatchStatus)]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),(String,Int,Int,BracketKind,String,String,Option[String],Option[String],Option[String],MatchStatus)](findCompetitionStatetxSql).to[List]((eventId,stageId)))

  private val updateCompetitionSynchronizetxSql = """update matches set a_id=?,b_id=?,winner_id=?,status=?,version=version+1 where event_id=? and stage_id=? and node_key=?"""
  def updateCompetitionSynchronizetx(connection: Connection, aId: Option[String], bId: Option[String], winnerId: Option[String], status: MatchStatus, eventId: String, stageId: String, nodeKey: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(Option[String],Option[String],Option[String],MatchStatus,String,String,String)](updateCompetitionSynchronizetxSql).run((aId,bId,winnerId,status,eventId,stageId,nodeKey)))

  private val findCompetitionSynchronizetxSql = """select id from matches where event_id=? and stage_id=? and status='drafting'"""
  def findCompetitionSynchronizetx(connection: Connection, eventId: String, stageId: String): IO[List[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),String](findCompetitionSynchronizetxSql).to[List]((eventId,stageId)))

  private val updateCompetitionSynchronizetx2Sql = """update matches set status='playing' where event_id=? and stage_id=? and status='drafting'"""
  def updateCompetitionSynchronizetx2(connection: Connection, eventId: String, stageId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateCompetitionSynchronizetx2Sql).run((eventId,stageId)))

  private val findCompetitionFinishtxSql = """select stage_id from matches where id=?"""
  def findCompetitionFinishtx(connection: Connection, id: String): IO[String] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findCompetitionFinishtxSql).unique(id))

  private val updateCompetitionFinishtxSql = """update matches set winner_id=?,status='finalized',version=version+1 where id=?"""
  def updateCompetitionFinishtx(connection: Connection, winnerId: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateCompetitionFinishtxSql).run((winnerId,id)))

  private val findChartsSnapshotSql = "select charts_snapshot::text from matches where id=?"
  def findChartsSnapshot(connection: Connection, id: String): IO[Option[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Option[String]](findChartsSnapshotSql).unique(id))

  private val archiveScheduleSql = """update matches m set schedule_state='historical',node_key=null,
    status=case when status in ('finalized','bye','empty','cancelled') then status else 'cancelled' end,version=version+1,
    charts_snapshot=coalesce(charts_snapshot,(select coalesce(jsonb_agg(p.metadata order by p.ordinal),'[]'::jsonb) from pool_entries p where p.event_id=m.event_id and
    (exists(select 1 from play_slots s where s.match_id=m.id and s.chart_key=p.chart_key) or exists(select 1 from draft_actions a where a.match_id=m.id and a.chart_key=p.chart_key))))
    where event_id=? and schedule_state='current'"""
  def archiveSchedule(connection: Connection, eventId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](archiveScheduleSql).run(eventId))

  private val attachCompletedSql = """update matches set stage_id=?,node_key=?,round=?,ordinal=?,schedule_state='current' where id=? and status='finalized'"""
  def attachCompleted(connection: Connection, stageId: String, nodeKey: String, round: Int, ordinal: Int, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,Int,Int,String)](attachCompletedSql).run((stageId,nodeKey,round,ordinal,id)))


  private val snapshotCompletedChartsSql = """update matches m set charts_snapshot=(select coalesce(jsonb_agg(p.metadata order by p.ordinal),'[]'::jsonb) from pool_entries p where p.event_id=m.event_id and
    (exists(select 1 from play_slots s where s.match_id=m.id and s.chart_key=p.chart_key) or exists(select 1 from draft_actions a where a.match_id=m.id and a.chart_key=p.chart_key)))
    where event_id=? and status in ('finalized','bye') and charts_snapshot is null"""
  def snapshotCompletedCharts(connection: Connection, eventId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](snapshotCompletedChartsSql).run(eventId))
