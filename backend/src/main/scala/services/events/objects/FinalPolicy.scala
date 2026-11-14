package services.events.objects

type FinalPolicy = "normal" | "reset" | "advantage"
object FinalPolicy:
  val values: Set[String] = Set("normal","reset","advantage")
  def fromString(value: String): Either[String, FinalPolicy] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[FinalPolicy], s"Unsupported FinalPolicy: $value")
  def toString(value: FinalPolicy): String = value

  given finalPolicyCodec: io.circe.Codec[FinalPolicy] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(FinalPolicy.fromString),io.circe.Encoder.encodeString.contramap(FinalPolicy.toString))
  given finalPolicyGet: org.typelevel.doobie.Get[FinalPolicy] = org.typelevel.doobie.Get[String].temap(FinalPolicy.fromString)
  given finalPolicyPut: org.typelevel.doobie.Put[FinalPolicy] = org.typelevel.doobie.Put[String].contramap(FinalPolicy.toString)
