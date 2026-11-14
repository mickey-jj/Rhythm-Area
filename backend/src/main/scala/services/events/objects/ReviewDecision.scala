package services.events.objects

type ReviewDecision = "accepted" | "approved" | "rejected"
object ReviewDecision:
  val values: Set[String] = Set("accepted","approved","rejected")
  def fromString(value: String): Either[String, ReviewDecision] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[ReviewDecision],s"Unsupported ReviewDecision: $value")
  def toString(value: ReviewDecision): String = value
  given io.circe.Codec[ReviewDecision] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
  given org.typelevel.doobie.Get[ReviewDecision] = org.typelevel.doobie.Get[String].temap(fromString)
  given org.typelevel.doobie.Put[ReviewDecision] = org.typelevel.doobie.Put[String].contramap(toString)
