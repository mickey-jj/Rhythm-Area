package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Placement(entryId: String, rank: Int, wins: Int, losses: Int)

/** Immutable match dependency graph. Empty seeds propagate as byes, never as fake scores. */

object Placement:
  given io.circe.Codec.AsObject[Placement] = io.circe.generic.semiauto.deriveCodec[Placement]
