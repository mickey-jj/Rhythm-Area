package services.events.objects.apiTypes
import services.events.objects.*
import services.events.objects.ClockAction.given
final case class MatchClockInput(action: ClockAction, expectedVersion: Int)
object MatchClockInput:
  given io.circe.Codec.AsObject[MatchClockInput] = io.circe.generic.semiauto.deriveCodec[MatchClockInput]
