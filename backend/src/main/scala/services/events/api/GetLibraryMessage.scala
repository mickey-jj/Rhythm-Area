package services.events.api
import cats.effect.IO
import java.sql.Connection
import services.events.objects.*
import services.events.tables.chart_library.ChartLibraryTable
import services.events.utils.LibraryMapping
import services.identity.objects.User
import services.instance.api.InstanceRequireOwnerMessage
import services.system.api.APIMessage

final case class GetLibraryMessage(user: User, gameKey: String) extends APIMessage[List[LibraryChart]]:
  def plan(connection: Connection): IO[List[LibraryChart]] = for
    _ <- InstanceRequireOwnerMessage(user).plan(connection)
    charts <- ChartLibraryTable.findGame(connection, LibraryMapping.gameKey(gameKey))
  yield charts
