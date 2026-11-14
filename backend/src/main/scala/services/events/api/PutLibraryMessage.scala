package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.tables.chart_library.ChartLibraryTable
import services.events.utils.{ArtworkValidation, LibraryMapping, RepositorySupport}
import services.identity.objects.User
import services.instance.api.InstanceRequireOwnerMessage
import services.system.api.APIMessage

final case class PutLibraryMessage(user: User, input: LibraryImportInput) extends APIMessage[List[LibraryChart]]:
  def plan(connection: Connection): IO[List[LibraryChart]] =
    val normalized = input.copy(gameKey=LibraryMapping.gameKey(input.gameKey),charts=input.charts.map(c => c.copy(game_key=LibraryMapping.gameKey(if c.game_key.trim.isEmpty then input.gameKey else c.game_key),chart_key=if c.game_key.trim.isEmpty && c.chart_key.startsWith(":") then LibraryMapping.gameKey(input.gameKey)+c.chart_key else c.chart_key)))
    val repo = new RepositorySupport(connection)
    import repo.*
    for
      _ <- InstanceRequireOwnerMessage(user).plan(connection)
      _ <- services.instance.tables.instance_settings.InstanceSettingsTable.findServiceUpdate(connection)
      _ <- check(normalized.gameKey.matches("[a-z0-9-]{1,64}") && normalized.charts.size <= 10000,400,"LIBRARY_LIMIT","每款游戏最多 10000 张谱面")
      _ <- check(normalized.charts.forall(c => c.game_key == normalized.gameKey && c.chart_key.nonEmpty && c.chart_key.length <= 500 && c.song_key.nonEmpty && c.song_key.length <= 500 && c.title.trim.nonEmpty && c.title.length <= 500 && c.difficulty_label.trim.nonEmpty && c.difficulty_label.length <= 100 && c.artist.length <= 1000 && c.game_version.length <= 100 && c.chart_type.length <= 100),400,"INVALID_LIBRARY","曲名、谱面标识与难度必填，游戏须与当前曲库一致")
      _ <- check(normalized.charts.map(_.chart_key).distinct.size == normalized.charts.size,400,"DUPLICATE_CHART","谱面标识重复")
      _ <- check(normalized.charts.forall(c => ArtworkValidation.validSource(c.cover_url)),400,"INVALID_ARTWORK","曲绘须为 HTTP(S) 地址或已上传的曲绘")
      existing <- ChartLibraryTable.findGame(connection,normalized.gameKey)
      byKey = existing.map(c => c.chart_key -> c).toMap
      _ <- check(normalized.mode == LibraryImportMode.Replace || (existing.map(_.chart_key) ++ normalized.charts.map(_.chart_key)).distinct.size <= 10000,400,"LIBRARY_LIMIT","合并后超过 10000 张谱面")
      _ <- if normalized.mode == LibraryImportMode.Replace then ChartLibraryTable.deleteGame(connection,normalized.gameKey).void else IO.unit
      incoming = normalized.charts.zipWithIndex.map { (c,i) =>
        val previous = if normalized.mode == LibraryImportMode.Merge then byKey.get(c.chart_key) else None
        c.copy(display_order=i+1,artist=if c.artist.nonEmpty then c.artist else previous.map(_.artist).getOrElse(""),
          game_version=if c.game_version.nonEmpty then c.game_version else previous.map(_.game_version).getOrElse(""),
          level_value=c.level_value.orElse(previous.flatMap(_.level_value)),cover_url=c.cover_url.orElse(previous.flatMap(_.cover_url)))
      }
      _ <- ChartLibraryTable.upsert(connection,incoming)
      charts <- ChartLibraryTable.findGame(connection,normalized.gameKey)
    yield charts
