package services.events.objects
type CaptainStatus = "none" | "pending" | "approved" | "rejected"
object CaptainStatus:
  private val values: Set[String] = Set("none","pending","approved","rejected")
  def fromString(value: String): Either[String,CaptainStatus] =
    val normalized=value.trim.toLowerCase
    Either.cond(values(normalized),normalized.asInstanceOf[CaptainStatus],"队长申请状态无效")
  def toString(value: CaptainStatus): String = value
  given captainStatusCodec: io.circe.Codec[CaptainStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
  given captainStatusGet: org.typelevel.doobie.Get[CaptainStatus] = org.typelevel.doobie.Get[String].temap(fromString)
  given captainStatusPut: org.typelevel.doobie.Put[CaptainStatus] = org.typelevel.doobie.Put[String].contramap(toString)
