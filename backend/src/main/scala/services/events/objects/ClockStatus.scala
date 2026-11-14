package services.events.objects
type ClockStatus = "ready" | "running" | "paused" | "expired" | "finished"
object ClockStatus:
  def fromString(value: String): Either[String,ClockStatus] = value match
    case "ready" => Right("ready")
    case "running" => Right("running")
    case "paused" => Right("paused")
    case "expired" => Right("expired")
    case "finished" => Right("finished")
    case _ => Left("Invalid ClockStatus")
  def toString(value: ClockStatus): String = value
  given io.circe.Codec[ClockStatus] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
