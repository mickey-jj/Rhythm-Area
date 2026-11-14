package services.events.tables.results

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

object ResultsTable:
  private val insertServiceFinalizematchSql = """insert into results(id,match_id,version,winner_id,explanation,confirmed_by) values (gen_random_uuid()::text,?,?,?,?::jsonb,?)"""
  def insertServiceFinalizematch(connection: Connection, matchId: String, version: Int, winnerId: String, explanation: String, confirmedBy: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,Int,String,String,String)](insertServiceFinalizematchSql).run((matchId,version,winnerId,explanation,confirmedBy)))

  private val insertOperationsReplaytxSql = """insert into results(id,match_id,version,winner_id,explanation,confirmed_by) values(gen_random_uuid()::text,?,?,?,?::jsonb,?)"""
  def insertOperationsReplaytx(connection: Connection, matchId: String, version: Int, winnerId: String, explanation: String, confirmedBy: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,Int,String,String,String)](insertOperationsReplaytxSql).run((matchId,version,winnerId,explanation,confirmedBy)))
