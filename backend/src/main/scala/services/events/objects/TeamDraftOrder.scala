package services.events.objects
type TeamDraftOrder = "snake" | "round-robin"
object TeamDraftOrder:
  private val values: Set[String] = Set("snake","round-robin")
  def fromString(value: String): Either[String,TeamDraftOrder] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[TeamDraftOrder],"轮选顺序无效")
  def toString(value: TeamDraftOrder): String = value
  given teamDraftOrderCodec: io.circe.Codec[TeamDraftOrder] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
