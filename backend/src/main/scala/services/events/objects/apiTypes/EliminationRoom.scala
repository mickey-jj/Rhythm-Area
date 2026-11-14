package services.events.objects.apiTypes
import services.events.objects.Entry
final case class EliminationRoom(group: EliminationGroup, entries: List[Entry], standings: List[EliminationStanding], canJudge: Boolean)
object EliminationRoom:
  given io.circe.Codec.AsObject[EliminationRoom] = io.circe.generic.semiauto.deriveCodec[EliminationRoom]
