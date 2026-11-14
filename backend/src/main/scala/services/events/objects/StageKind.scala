package services.events.objects

type StageKind = "ranking" | "single" | "double" | "round-robin"
object StageKind:
  val values: Set[String] = Set("ranking","single","double","round-robin")
  def fromString(value: String): Either[String, StageKind] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[StageKind], s"Unsupported StageKind: $value")
  def toString(value: StageKind): String = value

  given stageKindCodec: io.circe.Codec[StageKind] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(StageKind.fromString),io.circe.Encoder.encodeString.contramap(StageKind.toString))
  given stageKindGet: org.typelevel.doobie.Get[StageKind] = org.typelevel.doobie.Get[String].temap(StageKind.fromString)
  given stageKindPut: org.typelevel.doobie.Put[StageKind] = org.typelevel.doobie.Put[String].contramap(StageKind.toString)
