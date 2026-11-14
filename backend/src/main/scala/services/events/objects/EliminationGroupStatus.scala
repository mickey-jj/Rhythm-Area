package services.events.objects
type EliminationGroupStatus = "waiting" | "playing" | "completed" | "cancelled"
object EliminationGroupStatus:
  private val values: Set[String] = Set("waiting","playing","completed","cancelled")
  def fromString(value: String): Either[String,EliminationGroupStatus] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[EliminationGroupStatus],"多人晋级轮状态无效")
  def toString(value: EliminationGroupStatus): String = value
  given eliminationGroupStatusCodec: io.circe.Codec[EliminationGroupStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
