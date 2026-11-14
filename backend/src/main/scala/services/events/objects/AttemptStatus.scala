package services.events.objects

type AttemptStatus = "pending" | "approved" | "rejected" | "superseded"
object AttemptStatus:
  val values: Set[String] = Set("pending","approved","rejected","superseded")
  def fromString(value: String): Either[String, AttemptStatus] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[AttemptStatus], s"Unsupported AttemptStatus: $value")
  def toString(value: AttemptStatus): String = value

  given attemptStatusCodec: io.circe.Codec[AttemptStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(AttemptStatus.fromString),io.circe.Encoder.encodeString.contramap(AttemptStatus.toString))
  given attemptStatusGet: org.typelevel.doobie.Get[AttemptStatus] = org.typelevel.doobie.Get[String].temap(AttemptStatus.fromString)
  given attemptStatusPut: org.typelevel.doobie.Put[AttemptStatus] = org.typelevel.doobie.Put[String].contramap(AttemptStatus.toString)
