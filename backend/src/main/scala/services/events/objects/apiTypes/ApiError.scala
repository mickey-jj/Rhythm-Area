package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class ApiError(code: String, message: String, fieldPath: Option[String] = None, currentVersion: Option[Int] = None)

object ApiError:
  given io.circe.Codec.AsObject[ApiError] = io.circe.generic.semiauto.deriveCodec[ApiError]
