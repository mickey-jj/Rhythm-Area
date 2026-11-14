package services.events.objects.apiTypes
import services.events.objects.CaptainStatus
import services.events.objects.given
final case class CaptainDecisionInput(userId: String, decision: CaptainStatus)
object CaptainDecisionInput:
  given io.circe.Codec.AsObject[CaptainDecisionInput] = io.circe.generic.semiauto.deriveCodec[CaptainDecisionInput]
