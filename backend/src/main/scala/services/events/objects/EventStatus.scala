package services.events.objects

type EventStatus = "draft" | "registration" | "running" | "completed" | "archived"
object EventStatus:
  val values: Set[String] = Set("draft","registration","running","completed","archived")
  def fromString(value: String): Either[String, EventStatus] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[EventStatus], s"Unsupported EventStatus: $value")
  def toString(value: EventStatus): String = value

  given eventStatusCodec: io.circe.Codec[EventStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(EventStatus.fromString),io.circe.Encoder.encodeString.contramap(EventStatus.toString))
  given eventStatusGet: org.typelevel.doobie.Get[EventStatus] = org.typelevel.doobie.Get[String].temap(EventStatus.fromString)
  given eventStatusPut: org.typelevel.doobie.Put[EventStatus] = org.typelevel.doobie.Put[String].contramap(EventStatus.toString)
