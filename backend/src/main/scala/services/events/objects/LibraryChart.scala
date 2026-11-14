package services.events.objects

import io.circe.{Decoder, Encoder}

final case class LibraryChart(game_key: String, game_version: String, song_key: String, title: String, artist: String,
  chart_key: String, chart_type: String, difficulty_label: String, level_value: Option[BigDecimal], display_order: Int, cover_url: Option[String] = None)

object LibraryChart:
  given Encoder.AsObject[LibraryChart] = io.circe.generic.semiauto.deriveEncoder[LibraryChart]
  given Decoder[LibraryChart] = Decoder.instance { cursor =>
    def text(keys: String*): String = keys.toList.flatMap(key => cursor.get[String](key).toOption.orElse(cursor.get[Long](key).toOption.map(_.toString))).find(_.trim.nonEmpty).getOrElse("").trim
    val game = text("game_key", "gameKey", "game")
    val title = text("title", "name", "曲名")
    val song = text("song_key", "songKey", "song_id", "songId", "music_id")
    val difficulty = text("difficulty_label", "difficulty", "diff", "难度")
    val chartType = Option(text("chart_type", "chartType", "type")).filter(_.nonEmpty).getOrElse("standard")
    val key = text("chart_key", "chartKey", "id")
    val level = List("level_value", "constant", "ds", "level", "定数").flatMap(k => cursor.get[BigDecimal](k).toOption.orElse(cursor.get[String](k).toOption.flatMap(_.toDoubleOption).filter(_.isFinite).map(BigDecimal(_)))).headOption
    Right(LibraryChart(game, text("game_version", "version"), if song.nonEmpty then song else title, title, text("artist", "composer", "曲师"),
      if key.nonEmpty then key else s"$game:${if song.nonEmpty then song else title}:$chartType:$difficulty", chartType, difficulty, level, cursor.get[Int]("display_order").getOrElse(0), Option(text("cover_url", "coverUrl", "cover", "jacket_url", "artwork", "曲绘")).filter(_.nonEmpty)))
  }
