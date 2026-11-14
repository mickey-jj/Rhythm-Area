package services.events.objects

type Actor = "A" | "B" | "referee"
object Actor:
  val values: Set[String] = Set("A","B","referee")
  def fromString(value: String): Either[String, Actor] =
    val normalized = value.trim
    Either.cond(values(normalized), normalized.asInstanceOf[Actor], s"Unsupported Actor: $value")
  def toString(value: Actor): String = value

  given actorCodec: io.circe.Codec[Actor] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(Actor.fromString),io.circe.Encoder.encodeString.contramap(Actor.toString))
  given actorGet: org.typelevel.doobie.Get[Actor] = org.typelevel.doobie.Get[String].temap(Actor.fromString)
  given actorPut: org.typelevel.doobie.Put[Actor] = org.typelevel.doobie.Put[String].contramap(Actor.toString)
