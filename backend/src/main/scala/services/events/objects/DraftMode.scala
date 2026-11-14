package services.events.objects

type DraftMode = "open" | "sealed"
object DraftMode:
  val values: Set[String] = Set("open","sealed")
  def fromString(value: String): Either[String, DraftMode] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[DraftMode], s"Unsupported DraftMode: $value")
  def toString(value: DraftMode): String = value

  given draftModeCodec: io.circe.Codec[DraftMode] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(DraftMode.fromString),io.circe.Encoder.encodeString.contramap(DraftMode.toString))
  given draftModeGet: org.typelevel.doobie.Get[DraftMode] = org.typelevel.doobie.Get[String].temap(DraftMode.fromString)
  given draftModePut: org.typelevel.doobie.Put[DraftMode] = org.typelevel.doobie.Put[String].contramap(DraftMode.toString)
