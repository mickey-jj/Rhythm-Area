package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class RankingRow(entry: Entry, total: Option[String], complete: Boolean, rank: Option[Int], attemptIds: List[String])

object RankingRow:
  given io.circe.Codec.AsObject[RankingRow] = io.circe.generic.semiauto.deriveCodec[RankingRow]
