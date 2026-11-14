package services.events.objects
import io.circe.{Decoder, Encoder}

enum ChartRole:
  case Ban, Pick, Random, Assign, Extra, Qualifier, Mystery, Fixed

object ChartRole:
  def toString(value: ChartRole): String = value match
    case ChartRole.Ban => "ban"
    case ChartRole.Pick => "pick"
    case ChartRole.Random => "random"
    case ChartRole.Assign => "assign"
    case ChartRole.Extra => "extra"
    case ChartRole.Qualifier => "qualifier"
    case ChartRole.Mystery => "mystery"
    case ChartRole.Fixed => "fixed"
  def fromString(value: String): Either[String, ChartRole] =
    ChartRole.values.find(role => toString(role) == value.trim.toLowerCase).toRight("谱面用途无效")
  given Encoder[ChartRole] = Encoder.encodeString.contramap(toString)
  given Decoder[ChartRole] = Decoder.decodeString.emap(fromString)
