package services.events.utils
import services.events.objects.{Chart, ChartRole, LibraryChart}

private[events] object LibraryMapping:
  private[events] def gameKey(value: String): String = if value.trim.toLowerCase == "maimai" then "maimai-dx" else value.trim.toLowerCase
  private[events] def metadata(c: Chart): LibraryChart = LibraryChart(c.game_key,c.game_version,c.song_key,c.title,c.artist,c.chart_key,c.chart_type,c.difficulty_label,c.level_value,c.display_order,c.cover_url)
  private[events] def assigned(c: LibraryChart, pools: List[String], roles: List[ChartRole], ordinal: Int): Chart =
    Chart(c.game_key,c.game_version,c.song_key,c.title,c.artist,c.chart_key,c.chart_type,c.difficulty_label,c.level_value,pools.distinct.mkString("|"),roles.distinct.map(ChartRole.toString).mkString("|"),ordinal,c.cover_url)
