package services.events.objects
final case class MatchTiming(draftSeconds: Int = 60, chartSeconds: Int = 240)
object MatchTiming:
  given io.circe.Codec.AsObject[MatchTiming] = io.circe.generic.semiauto.deriveCodec[MatchTiming]
