package services.events.objects.apiTypes
final case class TeamPickInput(userId: String, expectedVersion: Int)
object TeamPickInput:
  given io.circe.Codec.AsObject[TeamPickInput] = io.circe.generic.semiauto.deriveCodec[TeamPickInput]
