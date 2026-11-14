package services.events.objects.apiTypes
import io.circe.{Decoder, Encoder}

final case class ArtworkView(key: String, url: String, mime: String, size: Long)
object ArtworkView:
  given Encoder.AsObject[ArtworkView] = io.circe.generic.semiauto.deriveEncoder[ArtworkView]
  given Decoder[ArtworkView] = io.circe.generic.semiauto.deriveDecoder[ArtworkView]
