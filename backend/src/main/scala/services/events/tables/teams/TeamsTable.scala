package services.events.tables.teams

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

object TeamsTable:
  private val updateServiceRegisterSql = """update teams set entry_id=?,frozen=true where event_id=? and captain_id=?"""
  def updateServiceRegister(connection: Connection, entryId: String, eventId: String, captainId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](updateServiceRegisterSql).run((entryId,eventId,captainId)))

  private val updateServiceGenerateSql = """update teams set frozen=true where event_id=?"""
  def updateServiceGenerate(connection: Connection, eventId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateServiceGenerateSql).run(eventId))

  private val findTeamsViewstxSql = """select id,name,captain_id,code,entry_id,frozen from teams where event_id=? order by name"""
  def findTeamsViewstx(connection: Connection, eventId: String): IO[List[(String,String,String,String,Option[String],Boolean)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,String,Option[String],Boolean)](findTeamsViewstxSql).to[List](eventId))

  private val insertTeamsCreateSql = """insert into teams(id,event_id,captain_id,name,code) values(?,?,?,?,?)"""
  def insertTeamsCreate(connection: Connection, id: String, eventId: String, captainId: String, name: String, code: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String,String)](insertTeamsCreateSql).run((id,eventId,captainId,name,code)))

  private val findTeamsJoinSql = """select id,frozen,entry_id from teams where event_id=? and code=?"""
  def findTeamsJoin(connection: Connection, eventId: String, code: String): IO[Option[(String,Boolean,Option[String])]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),(String,Boolean,Option[String])](findTeamsJoinSql).option((eventId,code)))

  private val findServiceRegisterSql = """select t.id,(select count(*) from team_members m where m.team_id=t.id) from teams t where t.event_id=? and t.captain_id=? and t.entry_id is null for update"""
  def findServiceRegister(connection: Connection, eventId: String, captainId: String): IO[Option[(String,Long)]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),(String,Long)](findServiceRegisterSql).option((eventId,captainId)))

