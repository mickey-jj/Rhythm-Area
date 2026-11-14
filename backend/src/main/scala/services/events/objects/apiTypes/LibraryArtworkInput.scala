package services.events.objects.apiTypes
import io.circe.{Decoder, Encoder}
import services.events.objects.SongArtwork

final case class LibraryArtworkInput(gameKey: String, items: List[SongArtwork])
object LibraryArtworkInput:
  given Encoder.AsObject[LibraryArtworkInput] = io.circe.generic.semiauto.deriveEncoder[LibraryArtworkInput]
  given Decoder[LibraryArtworkInput] = io.circe.generic.semiauto.deriveDecoder[LibraryArtworkInput]
