package services.events.objects

type EntryStatus = "pending" | "accepted" | "rejected" | "withdrawn"
object EntryStatus:
  val values: Set[String] = Set("pending","accepted","rejected","withdrawn")
  def fromString(value: String): Either[String, EntryStatus] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[EntryStatus], s"Unsupported EntryStatus: $value")
  def toString(value: EntryStatus): String = value

  given entryStatusCodec: io.circe.Codec[EntryStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(EntryStatus.fromString),io.circe.Encoder.encodeString.contramap(EntryStatus.toString))
  given entryStatusGet: org.typelevel.doobie.Get[EntryStatus] = org.typelevel.doobie.Get[String].temap(EntryStatus.fromString)
  given entryStatusPut: org.typelevel.doobie.Put[EntryStatus] = org.typelevel.doobie.Put[String].contramap(EntryStatus.toString)
