package services.events.objects

type BracketKind = "winners" | "losers" | "final" | "reset" | "round-robin"
object BracketKind:
  val values: Set[String] = Set("winners","losers","final","reset","round-robin")
  def fromString(value: String): Either[String, BracketKind] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[BracketKind],s"Unsupported BracketKind: $value")
  def toString(value: BracketKind): String = value
  given io.circe.Codec[BracketKind] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
  given org.typelevel.doobie.Get[BracketKind] = org.typelevel.doobie.Get[String].temap(fromString)
  given org.typelevel.doobie.Put[BracketKind] = org.typelevel.doobie.Put[String].contramap(toString)
