package services.events.objects
import io.circe.{Decoder, Encoder}

final case class ChartAssignment(chartKey: String, pools: List[String], roles: List[ChartRole])
object ChartAssignment:
  given Encoder.AsObject[ChartAssignment] = io.circe.generic.semiauto.deriveEncoder[ChartAssignment]
  given Decoder[ChartAssignment] = io.circe.generic.semiauto.deriveDecoder[ChartAssignment]
