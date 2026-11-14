package services.events.objects

type AppealStatus = "pending" | "resolved"
object AppealStatus:
  val values: Set[String] = Set("pending","resolved")
  def fromString(value: String): Either[String, AppealStatus] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[AppealStatus], s"Unsupported AppealStatus: $value")
  def toString(value: AppealStatus): String = value

  given appealStatusCodec: io.circe.Codec[AppealStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(AppealStatus.fromString),io.circe.Encoder.encodeString.contramap(AppealStatus.toString))
  given appealStatusGet: org.typelevel.doobie.Get[AppealStatus] = org.typelevel.doobie.Get[String].temap(AppealStatus.fromString)
  given appealStatusPut: org.typelevel.doobie.Put[AppealStatus] = org.typelevel.doobie.Put[String].contramap(AppealStatus.toString)
