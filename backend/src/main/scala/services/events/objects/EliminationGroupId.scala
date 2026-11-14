package services.events.objects
import scala.language.implicitConversions
final case class EliminationGroupId(value: String)
object EliminationGroupId:
  given Conversion[String,EliminationGroupId] = EliminationGroupId(_)
  given io.circe.Codec[EliminationGroupId] = io.circe.Codec.from(io.circe.Decoder.decodeString.map(EliminationGroupId(_)),io.circe.Encoder.encodeString.contramap(_.value))
