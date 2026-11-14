package services.events.objects
import services.events.objects.given
final case class RankingSession(eventId: String, stageId: String, status: RankingStatus, startedAt: Option[Long], endsAt: Option[Long], closedAt: Option[Long], stopReason: Option[RankingStopReason], version: Int, policy: RankingPolicy)
object RankingSession:
  given io.circe.Codec.AsObject[RankingSession] = io.circe.generic.semiauto.deriveCodec[RankingSession]
