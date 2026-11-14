package services.events.objects.apiTypes
import services.events.objects.*
import services.events.objects.given
import services.instance.objects.*
final case class SimulationResult(validation: Validation, actions: List[DraftAction], playOrder: List[SimulationSlot], error: Option[Issue])
object SimulationResult:
  given io.circe.Codec.AsObject[SimulationResult] = io.circe.generic.semiauto.deriveCodec[SimulationResult]
