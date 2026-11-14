package services.events.objects
import scala.language.implicitConversions
final case class EventId(value: String):
  override def toString: String = value
object EventId:
  given Conversion[String, EventId] = value => EventId(value)
  given io.circe.Codec[EventId] = io.circe.Codec.from(io.circe.Decoder.decodeString.map(EventId.apply),io.circe.Encoder.encodeString.contramap(_.value))
  given org.typelevel.doobie.Get[EventId] = org.typelevel.doobie.Get[String].map(EventId.apply)
  given org.typelevel.doobie.Put[EventId] = org.typelevel.doobie.Put[String].contramap(_.value)
