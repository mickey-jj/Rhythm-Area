package services.events.objects

type MatchStatus = "waiting" | "drafting" | "awaiting-reveal" | "playing" | "finalized" | "bye" | "empty" | "cancelled"
object MatchStatus:
  val values: Set[String] = Set("waiting","drafting","awaiting-reveal","playing","finalized","bye","empty","cancelled")
  def fromString(value: String): Either[String, MatchStatus] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[MatchStatus], s"Unsupported MatchStatus: $value")
  def toString(value: MatchStatus): String = value

  given matchStatusCodec: io.circe.Codec[MatchStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(MatchStatus.fromString),io.circe.Encoder.encodeString.contramap(MatchStatus.toString))
  given matchStatusGet: org.typelevel.doobie.Get[MatchStatus] = org.typelevel.doobie.Get[String].temap(MatchStatus.fromString)
  given matchStatusPut: org.typelevel.doobie.Put[MatchStatus] = org.typelevel.doobie.Put[String].contramap(MatchStatus.toString)
