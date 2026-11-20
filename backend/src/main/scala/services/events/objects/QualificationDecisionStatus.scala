package services.events.objects

import io.circe.{Codec, Decoder, Encoder}

enum QualificationDecisionStatus:
  case Required, Stale, Resolved

object QualificationDecisionStatus:
  given Codec[QualificationDecisionStatus] = Codec.from(
    Decoder.decodeString.emap {
      case "required" => Right(QualificationDecisionStatus.Required)
      case "stale" => Right(QualificationDecisionStatus.Stale)
      case "resolved" => Right(QualificationDecisionStatus.Resolved)
      case _ => Left("Unknown qualification decision status")
    },
    Encoder.encodeString.contramap {
      case QualificationDecisionStatus.Required => "required"
      case QualificationDecisionStatus.Stale => "stale"
      case QualificationDecisionStatus.Resolved => "resolved"
    }
  )
