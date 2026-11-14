package services.events.tables.pool_entries

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

object PoolEntriesTable:
  private val findRepositoryPoolSql = """select metadata::text from pool_entries where event_id=? order by ordinal"""
  def findRepositoryPool(connection: Connection, eventId: String): IO[List[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findRepositoryPoolSql).to[List](eventId))

  private val deleteRepositoryReplacepoolSql = """delete from pool_entries where event_id=?"""
  def deleteRepositoryReplacepool(connection: Connection, eventId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](deleteRepositoryReplacepoolSql).run(eventId))

  private val insertRepositoryReplacepoolSql = """insert into pool_entries(event_id,chart_key,song_key,game_key,metadata,ordinal) values (?,?,?,?,?::jsonb,?)"""
  def insertRepositoryReplacepool(connection: Connection, eventId: String, chartKey: String, songKey: String, gameKey: String, metadata: String, ordinal: Int): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String,String,Int)](insertRepositoryReplacepoolSql).run((eventId,chartKey,songKey,gameKey,metadata,ordinal)))


