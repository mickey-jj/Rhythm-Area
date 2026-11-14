package services.events.objects.apiTypes
import services.events.objects.*
final case class MatchClockBoard(clock: MatchClock, serverNow: Long, enabled: Boolean, canManage: Boolean)
object MatchClockBoard:
  given io.circe.Codec.AsObject[MatchClockBoard] = io.circe.generic.semiauto.deriveCodec[MatchClockBoard]
