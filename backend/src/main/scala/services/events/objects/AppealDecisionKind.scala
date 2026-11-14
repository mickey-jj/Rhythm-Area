package services.events.objects

type AppealDecisionKind = "uphold" | "replay" | "reject"
object AppealDecisionKind:
  val values: Set[String] = Set("uphold","replay","reject")
  def fromString(value: String): Either[String, AppealDecisionKind] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[AppealDecisionKind],s"Unsupported AppealDecisionKind: $value")
  def toString(value: AppealDecisionKind): String = value
  given io.circe.Codec[AppealDecisionKind] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
  given org.typelevel.doobie.Get[AppealDecisionKind] = org.typelevel.doobie.Get[String].temap(fromString)
  given org.typelevel.doobie.Put[AppealDecisionKind] = org.typelevel.doobie.Put[String].contramap(toString)
