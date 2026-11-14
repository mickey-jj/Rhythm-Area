package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.Chart
import services.events.tables.chart_library.ChartLibraryTable
import services.events.utils.LibraryMapping
import services.system.api.APIMessage

final case class AddPoolMetadataMessage(charts: List[Chart]) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] =
    charts.groupBy(_.game_key).toList.traverse_ { (game, items) =>
      ChartLibraryTable.findGame(connection,LibraryMapping.gameKey(game)).flatMap { existing =>
        if existing.isEmpty then ChartLibraryTable.insertMissing(connection,items.map(c => LibraryMapping.metadata(c).copy(game_key=LibraryMapping.gameKey(game)))).void else IO.unit
      }
    }
