package services.events.objects
import scala.language.implicitConversions
final case class AttemptId(value: String):
  override def toString: String = value
object AttemptId:
  given Conversion[String, AttemptId] = value => AttemptId(value)
  given io.circe.Codec[AttemptId] = io.circe.Codec.from(io.circe.Decoder.decodeString.map(AttemptId.apply),io.circe.Encoder.encodeString.contramap(_.value))
  given org.typelevel.doobie.Get[AttemptId] = org.typelevel.doobie.Get[String].map(AttemptId.apply)
  given org.typelevel.doobie.Put[AttemptId] = org.typelevel.doobie.Put[String].contramap(_.value)
