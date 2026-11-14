package services.events.objects
type RankingControlAction = "start" | "close" | "reopen"
object RankingControlAction:
  private val values: Set[String] = Set("start","close","reopen")
  def fromString(value: String): Either[String,RankingControlAction] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[RankingControlAction],"排名赛设置无效")
  def toString(value: RankingControlAction): String = value
  given rankingControlActionCodec: io.circe.Codec[RankingControlAction] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
