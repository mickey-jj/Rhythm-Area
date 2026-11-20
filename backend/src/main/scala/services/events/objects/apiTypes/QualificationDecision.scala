package services.events.objects.apiTypes

import services.events.objects.QualificationDecisionStatus

final case class QualificationDecision(
  status: QualificationDecisionStatus,
  snapshotKey: String,
  order: Option[List[String]]
)

object QualificationDecision:
  given io.circe.Codec.AsObject[QualificationDecision] = io.circe.generic.semiauto.deriveCodec[QualificationDecision]
