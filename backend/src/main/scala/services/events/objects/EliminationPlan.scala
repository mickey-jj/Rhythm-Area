package services.events.objects
final case class EliminationPlan(fixtures: List[Fixture], groups: List[EliminationGroupPlan])
object EliminationPlan:
  given io.circe.Codec.AsObject[EliminationPlan] = io.circe.generic.semiauto.deriveCodec[EliminationPlan]
