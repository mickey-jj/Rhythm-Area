package services.events.tables.chart_library

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object ChartLibraryTableInitializer:
  private val initializeV5Sql = """create table if not exists chart_library (
    game_key text not null, chart_key text not null, metadata jsonb not null, ordinal int not null,
    primary key(game_key,chart_key));
    insert into chart_library(game_key,chart_key,metadata,ordinal)
      select distinct on(game_key,chart_key) game_key,chart_key,metadata - 'pool_tag' - 'role',ordinal
      from pool_entries order by game_key,chart_key,ordinal on conflict do nothing;"""
  def initializeV5(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV5Sql).run(())).void
