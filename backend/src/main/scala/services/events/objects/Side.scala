package services.events.objects

type Side = "A" | "B"
object Side:
  val values: Set[String] = Set("A","B")
  def fromString(value: String): Either[String, Side] =
    val normalized = value.trim
    Either.cond(values(normalized),normalized.asInstanceOf[Side],s"Unsupported Side: $value")
  def toString(value: Side): String = value
  given io.circe.Codec[Side] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
  given org.typelevel.doobie.Get[Side] = org.typelevel.doobie.Get[String].temap(fromString)
  given org.typelevel.doobie.Put[Side] = org.typelevel.doobie.Put[String].contramap(toString)
