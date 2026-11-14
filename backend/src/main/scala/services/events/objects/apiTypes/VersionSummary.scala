package services.events.objects.apiTypes

final case class VersionSummary(version: Int, at: String)
object VersionSummary:
  given io.circe.Codec.AsObject[VersionSummary] = io.circe.generic.semiauto.deriveCodec[VersionSummary]
