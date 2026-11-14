package services.events.objects
type RankingStartMode = "publish" | "manual" | "scheduled"
object RankingStartMode:
  private val values: Set[String] = Set("publish","manual","scheduled")
  def fromString(value: String): Either[String,RankingStartMode] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[RankingStartMode],"排名赛设置无效")
  def toString(value: RankingStartMode): String = value
  given rankingStartModeCodec: io.circe.Codec[RankingStartMode] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
