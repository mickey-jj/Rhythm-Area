package services.events.objects
type CaptainSelection = "random" | "appointed" | "application" | "free"
object CaptainSelection:
  private val values: Set[String] = Set("random","appointed","application","free")
  def fromString(value: String): Either[String,CaptainSelection] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[CaptainSelection],"队长认定方式无效")
  def toString(value: CaptainSelection): String = value
  given captainSelectionCodec: io.circe.Codec[CaptainSelection] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
