package services.events.objects
import scala.language.implicitConversions
final case class MatchId(value: String):
  override def toString: String = value
object MatchId:
  given Conversion[String, MatchId] = value => MatchId(value)
  given io.circe.Codec[MatchId] = io.circe.Codec.from(io.circe.Decoder.decodeString.map(MatchId.apply),io.circe.Encoder.encodeString.contramap(_.value))
  given org.typelevel.doobie.Get[MatchId] = org.typelevel.doobie.Get[String].map(MatchId.apply)
  given org.typelevel.doobie.Put[MatchId] = org.typelevel.doobie.Put[String].contramap(_.value)
