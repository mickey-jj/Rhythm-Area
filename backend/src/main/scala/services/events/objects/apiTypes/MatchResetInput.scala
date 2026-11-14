package services.events.objects.apiTypes
final case class MatchResetInput(expectedVersion: Int, reason: String)
object MatchResetInput:
  given io.circe.Codec.AsObject[MatchResetInput] = io.circe.generic.semiauto.deriveCodec[MatchResetInput]
