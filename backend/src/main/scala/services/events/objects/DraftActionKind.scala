package services.events.objects

type DraftActionKind = "ban" | "pick" | "random" | "assign" | "remove"
object DraftActionKind:
  val values: Set[String] = Set("ban","pick","random","assign","remove")
  def fromString(value: String): Either[String, DraftActionKind] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[DraftActionKind], s"Unsupported DraftActionKind: $value")
  def toString(value: DraftActionKind): String = value

  given draftActionKindCodec: io.circe.Codec[DraftActionKind] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(DraftActionKind.fromString),io.circe.Encoder.encodeString.contramap(DraftActionKind.toString))
  given draftActionKindGet: org.typelevel.doobie.Get[DraftActionKind] = org.typelevel.doobie.Get[String].temap(DraftActionKind.fromString)
  given draftActionKindPut: org.typelevel.doobie.Put[DraftActionKind] = org.typelevel.doobie.Put[String].contramap(DraftActionKind.toString)
