package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class QualificationInput(order: List[String], reason: String, expectedVersion: Int, expectedSnapshotKey: Option[String] = None)

object QualificationInput:
  given io.circe.Codec.AsObject[QualificationInput] = io.circe.generic.semiauto.deriveCodec[QualificationInput]
