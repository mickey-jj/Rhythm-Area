package services.events.objects
import scala.language.implicitConversions
final case class EvidenceId(value: String):
  override def toString: String = value
object EvidenceId:
  given Conversion[String, EvidenceId] = value => EvidenceId(value)
  given io.circe.Codec[EvidenceId] = io.circe.Codec.from(io.circe.Decoder.decodeString.map(EvidenceId.apply),io.circe.Encoder.encodeString.contramap(_.value))
  given org.typelevel.doobie.Get[EvidenceId] = org.typelevel.doobie.Get[String].map(EvidenceId.apply)
  given org.typelevel.doobie.Put[EvidenceId] = org.typelevel.doobie.Put[String].contramap(_.value)
