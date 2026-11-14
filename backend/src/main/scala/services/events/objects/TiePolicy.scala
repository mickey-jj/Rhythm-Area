package services.events.objects

type TiePolicy = "extra" | "manual"
object TiePolicy:
  val values: Set[String] = Set("extra","manual")
  def fromString(value: String): Either[String, TiePolicy] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[TiePolicy], s"Unsupported TiePolicy: $value")
  def toString(value: TiePolicy): String = value

  given tiePolicyCodec: io.circe.Codec[TiePolicy] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(TiePolicy.fromString),io.circe.Encoder.encodeString.contramap(TiePolicy.toString))
  given tiePolicyGet: org.typelevel.doobie.Get[TiePolicy] = org.typelevel.doobie.Get[String].temap(TiePolicy.fromString)
  given tiePolicyPut: org.typelevel.doobie.Put[TiePolicy] = org.typelevel.doobie.Put[String].contramap(TiePolicy.toString)
