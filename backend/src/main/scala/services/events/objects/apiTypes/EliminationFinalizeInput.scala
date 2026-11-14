package services.events.objects.apiTypes
final case class EliminationFinalizeInput(expectedVersion: Int, order: List[String], reason: String)
object EliminationFinalizeInput:
  given io.circe.Codec.AsObject[EliminationFinalizeInput] = io.circe.generic.semiauto.deriveCodec[EliminationFinalizeInput]
