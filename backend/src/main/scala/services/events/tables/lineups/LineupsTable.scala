package services.events.tables.lineups

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

object LineupsTable:
  private val deleteTeamsLineupSql = """delete from lineups where match_id=? and entry_id=?"""
  def deleteTeamsLineup(connection: Connection, matchId: String, entryId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](deleteTeamsLineupSql).run((matchId,entryId)))

  private val insertTeamsLineupSql = """insert into lineups(match_id,entry_id,slot_id,user_id) values(?,?,?,?)"""
  def insertTeamsLineup(connection: Connection, matchId: String, entryId: String, slotId: String, userId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertTeamsLineupSql).run((matchId,entryId,slotId,userId)))

  private val findTeamsAggregatetxSql = """select slot_id,user_id from lineups where match_id=? and entry_id=?"""
  def findTeamsAggregatetx(connection: Connection, matchId: String, entryId: String): IO[List[(String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),(String,String)](findTeamsAggregatetxSql).to[List]((matchId,entryId)))

  private val deleteOperationsReplaytxSql = """delete from lineups where match_id=?"""
  def deleteOperationsReplaytx(connection: Connection, matchId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](deleteOperationsReplaytxSql).run(matchId))

  private val findTransportSql = """select entry_id,slot_id,user_id from lineups where match_id=? order by slot_id,user_id"""
  def findTransport(connection: Connection, matchId: String): IO[List[(String,String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String)](findTransportSql).to[List](matchId))
