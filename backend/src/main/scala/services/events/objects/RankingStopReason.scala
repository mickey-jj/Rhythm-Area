package services.events.objects
type RankingStopReason = "manual" | "deadline" | "threshold" | "advanced"
object RankingStopReason:
  private val values: Set[String] = Set("manual","deadline","threshold","advanced")
  def fromString(value: String): Either[String,RankingStopReason] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[RankingStopReason],"排名赛设置无效")
  def toString(value: RankingStopReason): String = value
  given rankingStopReasonCodec: io.circe.Codec[RankingStopReason] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
