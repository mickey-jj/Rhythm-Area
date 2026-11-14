package services.instance.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class InstanceView(needsSetup: Boolean, hasEvent: Boolean, published: Boolean, isOwner: Boolean, event: Option[EventView], appearance: Appearance, demoLoaded: Boolean, isJudge: Boolean)

object InstanceView:
  given io.circe.Codec.AsObject[InstanceView] = io.circe.generic.semiauto.deriveCodec[InstanceView]
