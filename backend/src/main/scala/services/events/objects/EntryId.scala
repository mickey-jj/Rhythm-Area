package services.events.objects
import scala.language.implicitConversions
final case class EntryId(value: String):
  override def toString: String = value
object EntryId:
  given Conversion[String, EntryId] = value => EntryId(value)
  given io.circe.Codec[EntryId] = io.circe.Codec.from(io.circe.Decoder.decodeString.map(EntryId.apply),io.circe.Encoder.encodeString.contramap(_.value))
  given org.typelevel.doobie.Get[EntryId] = org.typelevel.doobie.Get[String].map(EntryId.apply)
  given org.typelevel.doobie.Put[EntryId] = org.typelevel.doobie.Put[String].contramap(_.value)
