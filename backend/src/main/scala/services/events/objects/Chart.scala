package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Chart(game_key: String, game_version: String, song_key: String, title: String, artist: String,
  chart_key: String, chart_type: String, difficulty_label: String, level_value: Option[BigDecimal],
  pool_tag: String, role: String, display_order: Int, cover_url: Option[String] = None)

object Chart:
  given io.circe.Codec.AsObject[Chart] = io.circe.generic.semiauto.deriveCodec[Chart]
