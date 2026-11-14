package services.events.objects
import io.circe.{Decoder, Encoder}

enum LibraryImportMode:
  case Merge, Replace

object LibraryImportMode:
  def toString(value: LibraryImportMode): String = value match
    case LibraryImportMode.Merge => "merge"
    case LibraryImportMode.Replace => "replace"
  def fromString(value: String): Either[String, LibraryImportMode] = value.trim.toLowerCase match
    case "merge" => Right(LibraryImportMode.Merge)
    case "replace" => Right(LibraryImportMode.Replace)
    case _ => Left("导入模式无效")
  given Encoder[LibraryImportMode] = Encoder.encodeString.contramap(toString)
  given Decoder[LibraryImportMode] = Decoder.decodeString.emap(fromString)
