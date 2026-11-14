package services.events.tables.appeals

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

object AppealsTable:
  private val findServiceFinalizematchSql = """select count(*) from appeals where match_id=? and status='pending'"""
  def findServiceFinalizematch(connection: Connection, matchId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Long](findServiceFinalizematchSql).unique(matchId))

  private val findOperationsAppealSql = """select count(*) from appeals where match_id=? and user_id=? and status='pending'"""
  def findOperationsAppeal(connection: Connection, matchId: String, userId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),Long](findOperationsAppealSql).unique((matchId,userId)))

  private val insertOperationsAppealSql = """insert into appeals(id,event_id,match_id,user_id,reason) values(gen_random_uuid()::text,?,?,?,?)"""
  def insertOperationsAppeal(connection: Connection, eventId: String, matchId: String, userId: String, reason: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertOperationsAppealSql).run((eventId,matchId,userId,reason)))

  private val findOperationsAppealstxSql = """select id,match_id,user_id,reason,status,decision from appeals where event_id=? order by created_at desc"""
  def findOperationsAppealstx(connection: Connection, eventId: String): IO[List[AppealView]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,AppealView](findOperationsAppealstxSql).to[List](eventId))

  private val findOperationsDecideSql = """select event_id,match_id,user_id,status from appeals where id=? for update"""
  def findOperationsDecide(connection: Connection, id: String): IO[(String,String,String,String)] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,String)](findOperationsDecideSql).unique(id))

  private val updateOperationsDecideSql = """update appeals set status='resolved',decision=? where id=?"""
  def updateOperationsDecide(connection: Connection, decision: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateOperationsDecideSql).run((decision,id)))
