package services.events.objects
import scala.language.implicitConversions
final case class UserId(value: String):
  override def toString: String = value
object UserId:
  given Conversion[String, UserId] = value => UserId(value)
  given io.circe.Codec[UserId] = io.circe.Codec.from(io.circe.Decoder.decodeString.map(UserId.apply),io.circe.Encoder.encodeString.contramap(_.value))
  given org.typelevel.doobie.Get[UserId] = org.typelevel.doobie.Get[String].map(UserId.apply)
  given org.typelevel.doobie.Put[UserId] = org.typelevel.doobie.Put[String].contramap(_.value)
