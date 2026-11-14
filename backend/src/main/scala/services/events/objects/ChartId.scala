package services.events.objects
import scala.language.implicitConversions
final case class ChartId(value: String):
  override def toString: String = value
object ChartId:
  given Conversion[String, ChartId] = value => ChartId(value)
  given io.circe.Codec[ChartId] = io.circe.Codec.from(io.circe.Decoder.decodeString.map(ChartId.apply),io.circe.Encoder.encodeString.contramap(_.value))
  given org.typelevel.doobie.Get[ChartId] = org.typelevel.doobie.Get[String].map(ChartId.apply)
  given org.typelevel.doobie.Put[ChartId] = org.typelevel.doobie.Put[String].contramap(_.value)
