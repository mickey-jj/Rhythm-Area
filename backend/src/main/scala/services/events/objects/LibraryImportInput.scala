package services.events.objects
import io.circe.{Decoder, Encoder}

final case class LibraryImportInput(gameKey: String, charts: List[LibraryChart], mode: LibraryImportMode)
object LibraryImportInput:
  given Encoder.AsObject[LibraryImportInput] = io.circe.generic.semiauto.deriveEncoder[LibraryImportInput]
  given Decoder[LibraryImportInput] = io.circe.generic.semiauto.deriveDecoder[LibraryImportInput]
