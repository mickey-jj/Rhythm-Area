package services.events.objects
final case class EliminationGroupPlan(key: String, round: Int, advance: Int, sources: List[String], expectedParticipants: Int)
object EliminationGroupPlan:
  given io.circe.Codec.AsObject[EliminationGroupPlan] = io.circe.generic.semiauto.deriveCodec[EliminationGroupPlan]
