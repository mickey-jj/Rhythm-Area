package services.events.objects
type RankingStatus = "waiting" | "open" | "closed"
object RankingStatus:
  private val values: Set[String] = Set("waiting","open","closed")
  def fromString(value: String): Either[String,RankingStatus] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[RankingStatus],"排名赛设置无效")
  def toString(value: RankingStatus): String = value
  given rankingStatusCodec: io.circe.Codec[RankingStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
