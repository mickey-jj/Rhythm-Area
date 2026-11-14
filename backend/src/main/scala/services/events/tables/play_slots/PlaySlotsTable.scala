package services.events.tables.play_slots

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

object PlaySlotsTable:
  private val findRepositoryMatchviewSql = """select id,chart_key,ordinal,extra_round from play_slots where match_id=? order by ordinal"""
  def findRepositoryMatchview(connection: Connection, matchId: String): IO[List[MatchSlot]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,MatchSlot](findRepositoryMatchviewSql).to[List](matchId))

  private val insertServiceDraftSql = """insert into play_slots(match_id,id,chart_key,ordinal) values (?,?,?,?)"""
  def insertServiceDraft(connection: Connection, matchId: String, id: String, chartKey: String, ordinal: Int): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,Int)](insertServiceDraftSql).run((matchId,id,chartKey,ordinal)))

  private val insertServiceFinalizematchSql = """insert into play_slots(match_id,id,chart_key,ordinal,extra_round) values (?,?,?,?,?)"""
  def insertServiceFinalizematch(connection: Connection, matchId: String, id: String, chartKey: String, ordinal: Int, extraRound: Int): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,Int,Int)](insertServiceFinalizematchSql).run((matchId,id,chartKey,ordinal,extraRound)))

  private val deleteOperationsReplaytxSql = """delete from play_slots where match_id=?"""
  def deleteOperationsReplaytx(connection: Connection, matchId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](deleteOperationsReplaytxSql).run(matchId))

  private val insertCompetitionSynchronizetxSql = """insert into play_slots(match_id,id,chart_key,ordinal) values(?,?,?,?) on conflict do nothing"""
  def insertCompetitionSynchronizetx(connection: Connection, matchId: String, id: String, chartKey: String, ordinal: Int): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,Int)](insertCompetitionSynchronizetxSql).run((matchId,id,chartKey,ordinal)))
