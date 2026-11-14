package services.events.objects
import io.circe.{Decoder, Encoder}

enum ArtworkFormat:
  case Png, Jpeg, Webp

object ArtworkFormat:
  def toString(value: ArtworkFormat): String = value match
    case ArtworkFormat.Png => "png"
    case ArtworkFormat.Jpeg => "jpg"
    case ArtworkFormat.Webp => "webp"
  def fromString(value: String): Either[String, ArtworkFormat] = value match
    case "png" => Right(ArtworkFormat.Png)
    case "jpg" => Right(ArtworkFormat.Jpeg)
    case "webp" => Right(ArtworkFormat.Webp)
    case _ => Left("不支持的曲绘格式")
  def mime(value: ArtworkFormat): String = value match
    case ArtworkFormat.Png => "image/png"
    case ArtworkFormat.Jpeg => "image/jpeg"
    case ArtworkFormat.Webp => "image/webp"
  given Encoder[ArtworkFormat] = Encoder.encodeString.contramap(toString)
  given Decoder[ArtworkFormat] = Decoder.decodeString.emap(fromString)
