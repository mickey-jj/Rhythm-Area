package services.identity.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Credentials(username: String, password: String, displayName: Option[String])

object Credentials:
  given io.circe.Codec.AsObject[Credentials] = io.circe.generic.semiauto.deriveCodec[Credentials]
