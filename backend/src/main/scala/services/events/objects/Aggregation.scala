package services.events.objects

type Aggregation = "sum" | "average"
object Aggregation:
  val values: Set[String] = Set("sum","average")
  def fromString(value: String): Either[String, Aggregation] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[Aggregation], s"Unsupported Aggregation: $value")
  def toString(value: Aggregation): String = value

  given aggregationCodec: io.circe.Codec[Aggregation] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(Aggregation.fromString),io.circe.Encoder.encodeString.contramap(Aggregation.toString))
  given aggregationGet: org.typelevel.doobie.Get[Aggregation] = org.typelevel.doobie.Get[String].temap(Aggregation.fromString)
  given aggregationPut: org.typelevel.doobie.Put[Aggregation] = org.typelevel.doobie.Put[String].contramap(Aggregation.toString)
