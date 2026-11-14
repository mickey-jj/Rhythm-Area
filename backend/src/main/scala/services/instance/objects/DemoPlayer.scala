package services.instance.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class DemoPlayer(username: String, displayName: String, password: String)

object DemoPlayer:
  given io.circe.Codec.AsObject[DemoPlayer] = io.circe.generic.semiauto.deriveCodec[DemoPlayer]
