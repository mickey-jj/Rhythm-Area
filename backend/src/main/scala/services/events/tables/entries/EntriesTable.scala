package services.events.tables.entries

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

object EntriesTable:
  private val eligibleEvidenceSql = """select exists(select 1 from entries e where e.event_id=? and e.status='accepted' and (e.user_id=? or exists(select 1 from teams t join team_members m on m.team_id=t.id where t.entry_id=e.id and m.user_id=?)))"""
  def eligibleEvidence(connection: Connection, eventId: String, userId: String): IO[Boolean] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String,String),Boolean](eligibleEvidenceSql).unique((eventId,userId,userId)))

  private val findRepositoryEntriesSql = """select id,event_id,user_id,display_name,status,seed,reason from entries where event_id=? order by seed nulls last,created_at"""
  def findRepositoryEntries(connection: Connection, eventId: String): IO[List[Entry]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Entry](findRepositoryEntriesSql).to[List](eventId))

  private val findRepositoryEntrySql = """select id,event_id,user_id,display_name,status,seed,reason from entries where id=?"""
  def findRepositoryEntry(connection: Connection, id: String): IO[Option[Entry]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Entry](findRepositoryEntrySql).option(id))

  private val findServiceReopenSql = """select not exists(select 1 from entries where event_id=?) and not exists(select 1 from matches where event_id=?) and not exists(select 1 from attempts where event_id=?)"""
  def findServiceReopen(connection: Connection, eventId: String, eventId2: String, eventId3: String): IO[Boolean] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String,String),Boolean](findServiceReopenSql).unique((eventId,eventId2,eventId3)))

  private val findServiceRegisterSql = """select count(*) from entries where event_id=? and user_id=? and status<>'withdrawn'"""
  def findServiceRegister(connection: Connection, eventId: String, userId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),Long](findServiceRegisterSql).unique((eventId,userId)))

  private val findServiceRegister2Sql = """select count(*) from entries where event_id=? and status in ('accepted','pending')"""
  def findServiceRegister2(connection: Connection, eventId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Long](findServiceRegister2Sql).unique(eventId))

  private val insertServiceRegisterSql = """insert into entries(id,event_id,user_id,display_name) values (?,?,?,?) on conflict(event_id,user_id) do update set status='pending',display_name=excluded.display_name,reason=''"""
  def insertServiceRegister(connection: Connection, id: String, eventId: String, userId: String, displayName: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertServiceRegisterSql).run((id,eventId,userId,displayName)))

  private val findServiceRegister3Sql = """select id,event_id,user_id,display_name,status,seed,reason from entries where event_id=? and user_id=?"""
  def findServiceRegister3(connection: Connection, eventId: String, userId: String): IO[Entry] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),Entry](findServiceRegister3Sql).unique((eventId,userId)))

  private val updateServiceReviewentrySql = """update entries set status=?,reason=? where id=?"""
  def updateServiceReviewentry(connection: Connection, status: String, reason: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](updateServiceReviewentrySql).run((status,reason,id)))

  private val updateServiceGenerateSql = """update entries set seed=? where id=?"""
  def updateServiceGenerate(connection: Connection, seed: Int, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(Int,String)](updateServiceGenerateSql).run((seed,id)))

  private val findInstanceLoaddemoSql = """select count(*) from entries where event_id=?"""
  def findInstanceLoaddemo(connection: Connection, eventId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Long](findInstanceLoaddemoSql).unique(eventId))

  private val insertInstanceLoaddemoSql = """insert into entries(id,event_id,user_id,display_name,status) values (?,?,?,?,'accepted')"""
  def insertInstanceLoaddemo(connection: Connection, id: String, eventId: String, userId: String, displayName: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertInstanceLoaddemoSql).run((id,eventId,userId,displayName)))
