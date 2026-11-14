package services.events.objects

type StageStatus = "pending" | "running" | "completed" | "qualification-tie"
object StageStatus:
  val values: Set[String] = Set("pending","running","completed","qualification-tie")
  def fromString(value: String): Either[String, StageStatus] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[StageStatus], s"Unsupported StageStatus: $value")
  def toString(value: StageStatus): String = value

  given stageStatusCodec: io.circe.Codec[StageStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(StageStatus.fromString),io.circe.Encoder.encodeString.contramap(StageStatus.toString))
  given stageStatusGet: org.typelevel.doobie.Get[StageStatus] = org.typelevel.doobie.Get[String].temap(StageStatus.fromString)
  given stageStatusPut: org.typelevel.doobie.Put[StageStatus] = org.typelevel.doobie.Put[String].contramap(StageStatus.toString)
