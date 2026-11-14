package services.events.objects.apiTypes
import services.events.objects.ScoreItem
final case class EliminationStanding(entryId: String, total: Option[String], rank: Option[Int], items: List[ScoreItem])
object EliminationStanding:
  given io.circe.Codec.AsObject[EliminationStanding] = io.circe.generic.semiauto.deriveCodec[EliminationStanding]
