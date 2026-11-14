package services.events.tables.chart_library

import cats.effect.IO
import cats.syntax.all.*
import io.circe.syntax.*
import java.sql.Connection
import org.typelevel.doobie.implicits.*
import services.events.objects.LibraryChart
import services.system.api.Database

object ChartLibraryTable:
  private val findGameSql = "select metadata::text from chart_library where game_key = ? or (game_key = 'maimai' and ? = 'maimai-dx') order by case when game_key = 'maimai-dx' then 0 else 1 end, ordinal, chart_key"
  def findGame(connection: Connection, gameKey: String): IO[List[LibraryChart]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String), String](findGameSql).to[List]((gameKey,gameKey)))
      .flatMap(_.traverse(text => IO.fromEither(io.circe.parser.decode[LibraryChart](text))))
      .map(_.map(c => c.copy(game_key=gameKey)).distinctBy(_.chart_key))

  private val upsertSql = """insert into chart_library(game_key,chart_key,metadata,ordinal) values (?,?,?::jsonb,?)
    on conflict(game_key,chart_key) do update set metadata=excluded.metadata,ordinal=excluded.ordinal"""
  def upsert(connection: Connection, charts: List[LibraryChart]): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,Int)](upsertSql)
      .updateMany(charts.map(c => (c.game_key,c.chart_key,c.asJson.noSpaces,c.display_order))))

  private val insertMissingSql = "insert into chart_library(game_key,chart_key,metadata,ordinal) values (?,?,?::jsonb,?) on conflict do nothing"
  def insertMissing(connection: Connection, charts: List[LibraryChart]): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,Int)](insertMissingSql)
      .updateMany(charts.map(c => (c.game_key,c.chart_key,c.asJson.noSpaces,c.display_order))))

  private val deleteGameSql = "delete from chart_library where game_key = ? or (game_key = 'maimai' and ? = 'maimai-dx')"
  def deleteGame(connection: Connection, gameKey: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](deleteGameSql).run((gameKey,gameKey)))
