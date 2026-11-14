package services.events.objects

type EntryMode = "solo" | "team"
object EntryMode:
  val values: Set[String] = Set("solo","team")
  def fromString(value: String): Either[String, EntryMode] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[EntryMode], s"Unsupported EntryMode: $value")
  def toString(value: EntryMode): String = value

  given entryModeCodec: io.circe.Codec[EntryMode] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(EntryMode.fromString),io.circe.Encoder.encodeString.contramap(EntryMode.toString))
  given entryModeGet: org.typelevel.doobie.Get[EntryMode] = org.typelevel.doobie.Get[String].temap(EntryMode.fromString)
  given entryModePut: org.typelevel.doobie.Put[EntryMode] = org.typelevel.doobie.Put[String].contramap(EntryMode.toString)
