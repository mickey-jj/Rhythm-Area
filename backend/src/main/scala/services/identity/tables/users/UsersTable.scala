package services.identity.tables.users

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

object UsersTable:
  private val findRepositoryUserSql = """select id,username,display_name from users where id=?"""
  def findRepositoryUser(connection: Connection, id: String): IO[Option[User]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,User](findRepositoryUserSql).option(id))

  private val findOperationsGrantSql = """select id from users where username=?"""
  def findOperationsGrant(connection: Connection, username: String): IO[Option[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findOperationsGrantSql).option(username))

  private val findInstanceSetupSql = """select count(*) from users"""
  def findInstanceSetup(connection: Connection): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,Long](findInstanceSetupSql).unique(()))

  private val insertInstanceSetupSql = """insert into users(id,username,display_name,password_hash) values (?,?,?,?)"""
  def insertInstanceSetup(connection: Connection, id: String, username: String, displayName: String, passwordHash: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertInstanceSetupSql).run((id,username,displayName,passwordHash)))

  private val findInstanceLoaddemoSql = """select count(*) from users"""
  def findInstanceLoaddemo(connection: Connection): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,Long](findInstanceLoaddemoSql).unique(()))

  private val insertInstanceLoaddemoSql = """insert into users(id,username,display_name,password_hash) values (?,?,?,?)"""
  def insertInstanceLoaddemo(connection: Connection, id: String, username: String, displayName: String, passwordHash: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertInstanceLoaddemoSql).run((id,username,displayName,passwordHash)))

  private val findTransportSql = """select id,username,display_name,password_hash from users where username=?"""
  def findTransport(connection: Connection, username: String): IO[Option[(String,String,String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,String)](findTransportSql).option(username))

  private val insertTransportSql = """insert into users(id,username,display_name,password_hash) values (?,?,?,?) on conflict(username) do nothing"""
  def insertTransport(connection: Connection, id: String, username: String, displayName: String, passwordHash: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertTransportSql).run((id,username,displayName,passwordHash)))

  private val findOperationsJudgestxSql = """select u.username,u.display_name,coalesce(g.match_id,'') from (select user_id,cast(null as text) match_id from judge_grants where event_id=? union all select user_id,match_id from event_judges where event_id=?) g join users u on u.id=g.user_id"""
  def findOperationsJudgestx(connection: Connection, eventId: String, eventId2: String): IO[List[(String,String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),(String,String,String)](findOperationsJudgestxSql).to[List]((eventId,eventId2)))

