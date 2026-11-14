package services.events.objects
import ClockStatus.given
final case class MatchClock(matchId: String, phaseKey: String, chartIndex: Int, status: ClockStatus, remainingMs: Long, endsAt: Option[Long], version: Int, policy: MatchTiming)
object MatchClock:
  given io.circe.Codec.AsObject[MatchClock] = io.circe.generic.semiauto.deriveCodec[MatchClock]
