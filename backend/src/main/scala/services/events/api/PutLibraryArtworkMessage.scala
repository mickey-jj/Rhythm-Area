package services.events.api
import cats.effect.IO
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.LibraryArtworkInput
import services.events.tables.chart_library.ChartLibraryTable
import services.events.utils.{ArtworkValidation, LibraryMapping, RepositorySupport}
import services.identity.objects.User
import services.instance.api.InstanceRequireOwnerMessage
import services.system.api.APIMessage

final case class PutLibraryArtworkMessage(user: User, input: LibraryArtworkInput) extends APIMessage[List[LibraryChart]]:
  def plan(connection: Connection): IO[List[LibraryChart]] =
    val repo = new RepositorySupport(connection)
    import repo.*
    for
      _ <- InstanceRequireOwnerMessage(user).plan(connection)
      _ <- services.instance.tables.instance_settings.InstanceSettingsTable.findServiceUpdate(connection)
      _ <- check(input.items.nonEmpty && input.items.size <= 10000 && input.items.map(_.songKey).distinct.size == input.items.size && input.items.forall(i => ArtworkValidation.validSource(i.coverUrl)),400,"INVALID_ARTWORK","曲目或曲绘地址无效")
      charts <- ChartLibraryTable.findGame(connection,LibraryMapping.gameKey(input.gameKey))
      songs = charts.map(_.song_key).toSet
      _ <- check(input.items.forall(i => songs(i.songKey)),400,"UNKNOWN_SONG","曲库中没有对应曲目")
      changes = input.items.map(i => i.songKey -> i.coverUrl).toMap
      updated = charts.filter(c => changes.contains(c.song_key)).map(c => c.copy(cover_url=changes(c.song_key)))
      _ <- ChartLibraryTable.upsert(connection,updated)
    yield updated
