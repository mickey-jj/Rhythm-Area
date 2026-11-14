package services.events.objects

type MatchMode = "total" | "first-to"
object MatchMode:
  val values: Set[String] = Set("total","first-to")
  def fromString(value: String): Either[String, MatchMode] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[MatchMode], s"Unsupported MatchMode: $value")
  def toString(value: MatchMode): String = value

  given matchModeCodec: io.circe.Codec[MatchMode] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(MatchMode.fromString),io.circe.Encoder.encodeString.contramap(MatchMode.toString))
  given matchModeGet: org.typelevel.doobie.Get[MatchMode] = org.typelevel.doobie.Get[String].temap(MatchMode.fromString)
  given matchModePut: org.typelevel.doobie.Put[MatchMode] = org.typelevel.doobie.Put[String].contramap(MatchMode.toString)
