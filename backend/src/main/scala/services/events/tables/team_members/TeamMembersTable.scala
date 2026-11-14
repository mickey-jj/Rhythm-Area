package services.events.tables.team_members

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

object TeamMembersTable:

  private val leaveSql = "DELETE FROM team_members WHERE event_id=? AND user_id=?"
  def leave(connection: Connection, eventId: String, userId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](leaveSql).run((eventId,userId)))

  private val findTeamsViewstxSql = """select u.id,u.username,u.display_name from team_members m join users u on u.id=m.user_id where m.team_id=? order by u.created_at"""
  def findTeamsViewstx(connection: Connection, teamId: String): IO[List[User]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,User](findTeamsViewstxSql).to[List](teamId))

  private val findTeamsCreateSql = """select count(*) from team_members where event_id=? and user_id=?"""
  def findTeamsCreate(connection: Connection, eventId: String, userId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),Long](findTeamsCreateSql).unique((eventId,userId)))

  private val insertTeamsCreateSql = """insert into team_members(team_id,event_id,user_id) values(?,?,?)"""
  def insertTeamsCreate(connection: Connection, teamId: String, eventId: String, userId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](insertTeamsCreateSql).run((teamId,eventId,userId)))

  private val findTeamsJoinSql = """select count(*) from team_members where event_id=? and user_id=?"""
  def findTeamsJoin(connection: Connection, eventId: String, userId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),Long](findTeamsJoinSql).unique((eventId,userId)))

  private val findTeamsJoin2Sql = """select count(*) from team_members where team_id=?"""
  def findTeamsJoin2(connection: Connection, teamId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Long](findTeamsJoin2Sql).unique(teamId))

  private val insertTeamsJoinSql = """insert into team_members(team_id,event_id,user_id) values(?,?,?)"""
  def insertTeamsJoin(connection: Connection, teamId: String, eventId: String, userId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](insertTeamsJoinSql).run((teamId,eventId,userId)))

  private val findTeamsLineupSql = """select tm.user_id from team_members tm join teams t on t.id=tm.team_id where t.entry_id=?"""
  def findTeamsLineup(connection: Connection, entryId: String): IO[List[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findTeamsLineupSql).to[List](entryId))

  private val findTeamsAggregatetxSql = """select tm.user_id from team_members tm join teams t on t.id=tm.team_id where t.entry_id=?"""
  def findTeamsAggregatetx(connection: Connection, entryId: String): IO[List[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findTeamsAggregatetxSql).to[List](entryId))
