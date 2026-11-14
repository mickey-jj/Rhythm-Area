package services.events.objects
type TeamFormation = "free" | "draft" | "random"
object TeamFormation:
  private val values: Set[String] = Set("free","draft","random")
  def fromString(value: String): Either[String,TeamFormation] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[TeamFormation],"组队方式无效")
  def toString(value: TeamFormation): String = value
  given teamFormationCodec: io.circe.Codec[TeamFormation] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
