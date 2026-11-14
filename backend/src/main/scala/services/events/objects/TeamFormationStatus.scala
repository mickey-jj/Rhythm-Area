package services.events.objects
type TeamFormationStatus = "drafting" | "completed"
object TeamFormationStatus:
  private val values: Set[String] = Set("drafting","completed")
  def fromString(value: String): Either[String,TeamFormationStatus] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[TeamFormationStatus],"组队状态无效")
  def toString(value: TeamFormationStatus): String = value
  given teamFormationStatusCodec: io.circe.Codec[TeamFormationStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
