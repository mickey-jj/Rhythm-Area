package services.events.objects

type DraftTarget = "pool" | "picked"
object DraftTarget:
  val values: Set[String] = Set("pool","picked")
  def fromString(value: String): Either[String, DraftTarget] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[DraftTarget], s"Unsupported DraftTarget: $value")
  def toString(value: DraftTarget): String = value

  given draftTargetCodec: io.circe.Codec[DraftTarget] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(DraftTarget.fromString),io.circe.Encoder.encodeString.contramap(DraftTarget.toString))
  given draftTargetGet: org.typelevel.doobie.Get[DraftTarget] = org.typelevel.doobie.Get[String].temap(DraftTarget.fromString)
  given draftTargetPut: org.typelevel.doobie.Put[DraftTarget] = org.typelevel.doobie.Put[String].contramap(DraftTarget.toString)
