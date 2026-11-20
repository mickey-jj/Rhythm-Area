package services.events.tables.attempts

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

object AttemptsTable:
  private val approvedMatchSlotsSql = """select distinct a.entry_id,i.slot_id from attempts a join attempt_items i on i.attempt_id=a.id where a.match_id=? and a.generation=? and a.status='approved'"""
  def approvedMatchSlots(connection: Connection, matchId: String, generation: Int): IO[List[(String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,Int),(String,String)](approvedMatchSlotsSql).to[List]((matchId,generation)))

  private val supersedeGroupSql = "update attempts set status='superseded' where group_id=? and status<>'superseded'"
  def supersedeGroup(connection: Connection, groupId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](supersedeGroupSql).run(groupId))
  private val groupIdSql = "SELECT group_id FROM attempts WHERE id=?"
  def groupId(connection: Connection, id: String): IO[Option[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Option[String]](groupIdSql).unique(id))
  private val setGroupSql = "UPDATE attempts SET group_id=? WHERE id=?"
  def setGroup(connection: Connection, groupId: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](setGroupSql).run((groupId,id)))
  private val groupAttemptsSql = "SELECT id,entry_id,status,sequence FROM attempts WHERE group_id=? ORDER BY sequence DESC"
  def groupAttempts(connection: Connection, groupId: String): IO[List[(String,String,AttemptStatus,Long)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,AttemptStatus,Long)](groupAttemptsSql).to[List](groupId))
  private val supersedeGroupsSql = """UPDATE attempts SET status='superseded' WHERE group_id IN(SELECT id FROM elimination_groups WHERE event_id=? AND state_json->>'scheduleState'='current' AND state_json->>'status'<>'completed') AND status<>'superseded'"""
  def supersedeGroups(connection: Connection, eventId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](supersedeGroupsSql).run(eventId))
  private val findRepositoryAttemptsSql = """select evidence_id from attempts where id=?"""
  def findRepositoryAttempts(connection: Connection, id: String): IO[Option[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Option[String]](findRepositoryAttemptsSql).unique(id))

  private val findRepositoryRankingattemptsSql = """select id,entry_id,status,sequence from attempts where event_id=? and match_id is null and group_id is null"""
  def findRepositoryRankingattempts(connection: Connection, eventId: String): IO[List[(String,String,AttemptStatus,Long)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,AttemptStatus,Long)](findRepositoryRankingattemptsSql).to[List](eventId))

  private val findServiceGenerateSql = """select count(*) from attempts where event_id=? and match_id is null and group_id is null and status='pending'"""
  def findServiceGenerate(connection: Connection, eventId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Long](findServiceGenerateSql).unique(eventId))

  private val insertServiceSubmitSql = """insert into attempts(id,event_id,match_id,entry_id,submitted_by,evidence_note,generation,evidence_id) values (?,?,?,?,?,?,?,?)"""
  def insertServiceSubmit(connection: Connection, id: String, eventId: String, matchId: Option[String], entryId: String, submittedBy: String, evidenceNote: String, generation: Int, evidenceId: Option[String]): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,Option[String],String,String,String,Int,Option[String])](insertServiceSubmitSql).run((id,eventId,matchId,entryId,submittedBy,evidenceNote,generation,evidenceId)))

  private val findServiceReviewattemptSql = """select event_id,submitted_by,status from attempts where id=?"""
  def findServiceReviewattempt(connection: Connection, id: String): IO[Option[(String,String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String)](findServiceReviewattemptSql).option(id))

  private val findServiceReviewattempt2Sql = """select match_id from attempts where id=?"""
  def findServiceReviewattempt2(connection: Connection, id: String): IO[Option[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Option[String]](findServiceReviewattempt2Sql).unique(id))

  private val findServiceReviewattempt3Sql = """select count(*) from attempts a join teams t on t.entry_id=a.entry_id join team_members tm on tm.team_id=t.id where a.id=? and tm.user_id=?"""
  def findServiceReviewattempt3(connection: Connection, id: String, userId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),Long](findServiceReviewattempt3Sql).unique((id,userId)))

  private val updateServiceReviewattemptSql = """update attempts set status=? where id=?"""
  def updateServiceReviewattempt(connection: Connection, status: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateServiceReviewattemptSql).run((status,id)))

  private val findTeamsLineupSql = """select count(*) from attempts a join attempt_items i on i.attempt_id=a.id join play_slots s on s.match_id=a.match_id and s.id=i.slot_id where a.match_id=? and a.entry_id=? and a.generation=? and s.extra_round=?"""
  def findTeamsLineup(connection: Connection, matchId: String, entryId: String, generation: Int, extraRound: Int): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String,Int,Int),Long](findTeamsLineupSql).unique((matchId,entryId,generation,extraRound)))

  private val updateOperationsReplaytxSql = """update attempts set status='superseded' where match_id=? and status<>'superseded'"""
  def updateOperationsReplaytx(connection: Connection, matchId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateOperationsReplaytxSql).run(matchId))

  private val findEvidenceReadSql = """select match_id from attempts where evidence_id=?"""
  def findEvidenceRead(connection: Connection, evidenceId: String): IO[List[Option[String]]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Option[String]](findEvidenceReadSql).to[List](evidenceId))

  private val findRepositoryAttemptsRowsSql = """select a.id,a.event_id,a.match_id,a.entry_id,e.display_name,a.submitted_by,a.status,a.sequence,a.evidence_note,
      (select reason from reviews where attempt_id=a.id),(extract(epoch from a.created_at)*1000)::bigint from attempts a join entries e on e.id=a.entry_id
      where a.event_id=? and (? or a.submitted_by=?) order by a.sequence desc"""
  def findRepositoryAttemptsRows(connection: Connection, eventId: String, privileged: Boolean, submittedBy: String): IO[List[(String,String,Option[String],String,String,String,AttemptStatus,Long,String,Option[String],Long)]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,Boolean,String),(String,String,Option[String],String,String,String,AttemptStatus,Long,String,Option[String],Long)](findRepositoryAttemptsRowsSql).to[List]((eventId,privileged,submittedBy)))

