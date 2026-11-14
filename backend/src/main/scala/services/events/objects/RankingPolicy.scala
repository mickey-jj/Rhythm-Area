package services.events.objects
import services.events.objects.given
final case class RankingPolicy(startMode: RankingStartMode, endMode: RankingEndMode, startAt: Option[String], deadline: Option[String], durationSeconds: Option[Int], targetCount: Option[Int], targetScore: Option[String])
object RankingPolicy:
  given io.circe.Codec.AsObject[RankingPolicy] = io.circe.generic.semiauto.deriveCodec[RankingPolicy]
