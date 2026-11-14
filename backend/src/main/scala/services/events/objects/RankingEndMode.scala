package services.events.objects
type RankingEndMode = "manual" | "fixed" | "duration" | "threshold"
object RankingEndMode:
  private val values: Set[String] = Set("manual","fixed","duration","threshold")
  def fromString(value: String): Either[String,RankingEndMode] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[RankingEndMode],"排名赛设置无效")
  def toString(value: RankingEndMode): String = value
  given rankingEndModeCodec: io.circe.Codec[RankingEndMode] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
