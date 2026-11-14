package services.events.tables.competition_stages

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

object CompetitionStagesTable:
  private val insertServiceGenerateSql = """insert into competition_stages(event_id,stage_id,ordinal,kind,status,participants,placements) values (?,?,0,'ranking','completed',?::jsonb,?::jsonb)"""
  def insertServiceGenerate(connection: Connection, eventId: String, stageId: String, participants: String, placements: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertServiceGenerateSql).run((eventId,stageId,participants,placements)))

  private val findOperationsReplaytxSql = """select stage_id,status from competition_stages where event_id=? order by ordinal"""
  def findOperationsReplaytx(connection: Connection, eventId: String): IO[List[(String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String)](findOperationsReplaytxSql).to[List](eventId))

  private val updateOperationsReplaytxSql = """update competition_stages set status='running',placements='[]'::jsonb where event_id=? and stage_id=?"""
  def updateOperationsReplaytx(connection: Connection, eventId: String, stageId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateOperationsReplaytxSql).run((eventId,stageId)))

  private val insertCompetitionStarttxSql = """insert into competition_stages(event_id,stage_id,ordinal,kind,participants) values(?,?,?,?,?::jsonb)"""
  def insertCompetitionStarttx(connection: Connection, eventId: String, stageId: String, ordinal: Int, kind: StageKind, participants: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,Int,StageKind,String)](insertCompetitionStarttxSql).run((eventId,stageId,ordinal,kind,participants)))

  private val findCompetitionCompletetxSql = """select participants::text,ordinal,initial_losses::text from competition_stages where event_id=? and stage_id=?"""
  def findCompetitionCompletetx(connection: Connection, eventId: String, stageId: String): IO[(String,Int,String)] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),(String,Int,String)](findCompetitionCompletetxSql).unique((eventId,stageId)))

  private val updateCompetitionCompletetxSql = """update competition_stages set status='completed',placements=?::jsonb where event_id=? and stage_id=?"""
  def updateCompetitionCompletetx(connection: Connection, placements: String, eventId: String, stageId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](updateCompetitionCompletetxSql).run((placements,eventId,stageId)))

  private val updateCompetitionCompletetx2Sql = """update competition_stages set status='qualification-tie',reason='冠军名次并列，须记录附加赛判定' where event_id=? and stage_id=?"""
  def updateCompetitionCompletetx2(connection: Connection, eventId: String, stageId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateCompetitionCompletetx2Sql).run((eventId,stageId)))

  private val updateCompetitionAdvancetxSql = """update competition_stages set status='qualification-tie',reason='晋级边界同名次，需裁判依据附加赛结果确定顺序' where event_id=? and stage_id=?"""
  def updateCompetitionAdvancetx(connection: Connection, eventId: String, stageId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateCompetitionAdvancetxSql).run((eventId,stageId)))

  private val findCompetitionResolvetxSql = """select status,ordinal,placements::text from competition_stages where event_id=? and stage_id=? for update"""
  def findCompetitionResolvetx(connection: Connection, eventId: String, stageId: String): IO[(String,Int,String)] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),(String,Int,String)](findCompetitionResolvetxSql).unique((eventId,stageId)))

  private val updateCompetitionResolvetxSql = """update competition_stages set status='completed',reason=? where event_id=? and stage_id=?"""
  def updateCompetitionResolvetx(connection: Connection, reason: String, eventId: String, stageId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](updateCompetitionResolvetxSql).run((reason,eventId,stageId)))

  private val updateCompetitionResolvetx2Sql = """update competition_stages set placements=?::jsonb where event_id=? and stage_id=?"""
  def updateCompetitionResolvetx2(connection: Connection, placements: String, eventId: String, stageId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](updateCompetitionResolvetx2Sql).run((placements,eventId,stageId)))

  private val findCompetitionViewstxSql = """select stage_id,kind,status,participants::text,placements::text from competition_stages where event_id=? order by ordinal"""
  def findCompetitionViewstx(connection: Connection, eventId: String): IO[List[(String,StageKind,StageStatus,String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,StageKind,StageStatus,String,String)](findCompetitionViewstxSql).to[List](eventId))

  private val findRebuildSourceSql = "select stage_id,ordinal,kind,participants::text,initial_losses::text from competition_stages where event_id=? and status in ('running','qualification-tie') order by ordinal limit 1"
  def findRebuildSource(connection: Connection, eventId: String): IO[Option[(String,Int,StageKind,String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,Int,StageKind,String,String)](findRebuildSourceSql).option(eventId))

  private val deleteForRebuildSql = "delete from competition_stages where event_id=? and (ordinal>=? or stage_id=?)"
  def deleteForRebuild(connection: Connection, eventId: String, ordinal: Int, stageId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,Int,String)](deleteForRebuildSql).run((eventId,ordinal,stageId)))

  private val saveInitialLossesSql = "update competition_stages set initial_losses=?::jsonb where event_id=? and stage_id=?"
  def saveInitialLosses(connection: Connection, losses: String, eventId: String, stageId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](saveInitialLossesSql).run((losses,eventId,stageId)))
