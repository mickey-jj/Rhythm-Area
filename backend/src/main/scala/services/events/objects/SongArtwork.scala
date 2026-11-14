package services.events.objects
import io.circe.{Decoder, Encoder}

final case class SongArtwork(songKey: String, coverUrl: Option[String])
object SongArtwork:
  given Encoder.AsObject[SongArtwork] = io.circe.generic.semiauto.deriveEncoder[SongArtwork]
  given Decoder[SongArtwork] = io.circe.generic.semiauto.deriveDecoder[SongArtwork]
