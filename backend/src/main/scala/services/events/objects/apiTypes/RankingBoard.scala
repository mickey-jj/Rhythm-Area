package services.events.objects.apiTypes
import services.events.objects.RankingSession
final case class RankingBoard(stageId: String, stageName: String, session: RankingSession, serverNow: Long, qualifiedCount: Int, rankings: List[RankingRow], canManage: Boolean, qualificationDecision: Option[QualificationDecision] = None)
object RankingBoard:
  given io.circe.Codec.AsObject[RankingBoard] = io.circe.generic.semiauto.deriveCodec[RankingBoard]
