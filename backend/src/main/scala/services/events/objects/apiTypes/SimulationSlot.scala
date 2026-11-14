package services.events.objects.apiTypes
import services.events.objects.*
import services.events.objects.given
import services.instance.objects.*
final case class SimulationSlot(slotId: String, chartKey: String)
object SimulationSlot:
  given io.circe.Codec.AsObject[SimulationSlot] = io.circe.generic.semiauto.deriveCodec[SimulationSlot]
