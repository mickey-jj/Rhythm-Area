package services.events.objects.apiTypes
import services.events.objects.RankingControlAction
import services.events.objects.given
final case class RankingControlInput(action: RankingControlAction, expectedVersion: Int)
object RankingControlInput:
  given io.circe.Codec.AsObject[RankingControlInput] = io.circe.generic.semiauto.deriveCodec[RankingControlInput]
