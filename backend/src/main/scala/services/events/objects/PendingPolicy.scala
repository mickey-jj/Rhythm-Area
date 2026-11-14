package services.events.objects

type PendingPolicy = "retain" | "hide"
object PendingPolicy:
  val values: Set[String] = Set("retain","hide")
  def fromString(value: String): Either[String, PendingPolicy] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[PendingPolicy], s"Unsupported PendingPolicy: $value")
  def toString(value: PendingPolicy): String = value

  given pendingPolicyCodec: io.circe.Codec[PendingPolicy] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(PendingPolicy.fromString),io.circe.Encoder.encodeString.contramap(PendingPolicy.toString))
  given pendingPolicyGet: org.typelevel.doobie.Get[PendingPolicy] = org.typelevel.doobie.Get[String].temap(PendingPolicy.fromString)
  given pendingPolicyPut: org.typelevel.doobie.Put[PendingPolicy] = org.typelevel.doobie.Put[String].contramap(PendingPolicy.toString)
