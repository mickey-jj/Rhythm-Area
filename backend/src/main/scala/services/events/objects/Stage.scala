package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Stage(id: String, name: String, kind: StageKind, advance: Int, plan: Option[StagePlan] = None, ranking: Option[RankingPolicy] = None):
  def effective(r: RuleSet): RuleSet = plan.map(p => r.copy(metric=p.metric,matchMode=p.matchMode,winsRequired=p.winsRequired,draft=p.draft,playOrder=p.playOrder,resolution=p.resolution,draftMode=p.draftMode.orElse(r.draftMode),tieBreak=p.tieBreak.orElse(r.tieBreak),timing=p.timing.orElse(r.timing))).getOrElse(r)

object Stage:
  given io.circe.Codec.AsObject[Stage] = io.circe.generic.semiauto.deriveCodec[Stage]
