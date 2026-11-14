package services.events.objects

type TieScope = "extra-only" | "cumulative"
object TieScope:
  val values: Set[String] = Set("extra-only","cumulative")
  def fromString(value: String): Either[String, TieScope] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[TieScope], s"Unsupported TieScope: $value")
  def toString(value: TieScope): String = value

  given tieScopeCodec: io.circe.Codec[TieScope] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(TieScope.fromString),io.circe.Encoder.encodeString.contramap(TieScope.toString))
  given tieScopeGet: org.typelevel.doobie.Get[TieScope] = org.typelevel.doobie.Get[String].temap(TieScope.fromString)
  given tieScopePut: org.typelevel.doobie.Put[TieScope] = org.typelevel.doobie.Put[String].contramap(TieScope.toString)
