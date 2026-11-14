package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Resolution(tie: TiePolicy, extraPool: String, extraCount: Int, scope: TieScope, maxExtraRounds: Int, finalPolicy: FinalPolicy)

object Resolution:
  given io.circe.Codec.AsObject[Resolution] = io.circe.generic.semiauto.deriveCodec[Resolution]
