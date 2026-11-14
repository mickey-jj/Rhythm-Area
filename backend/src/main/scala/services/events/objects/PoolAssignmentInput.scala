package services.events.objects
import io.circe.{Decoder, Encoder}

final case class PoolAssignmentInput(expectedVersion: Int, assignments: List[ChartAssignment])
object PoolAssignmentInput:
  given Encoder.AsObject[PoolAssignmentInput] = io.circe.generic.semiauto.deriveEncoder[PoolAssignmentInput]
  given Decoder[PoolAssignmentInput] = io.circe.generic.semiauto.deriveDecoder[PoolAssignmentInput]
