package services.events.objects
type ClockAction = "start" | "pause" | "resume" | "next" | "restart"
object ClockAction:
  def fromString(value: String): Either[String,ClockAction] = value match
    case "start" => Right("start")
    case "pause" => Right("pause")
    case "resume" => Right("resume")
    case "next" => Right("next")
    case "restart" => Right("restart")
    case _ => Left("Invalid ClockAction")
  def toString(value: ClockAction): String = value
  given io.circe.Codec[ClockAction] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(fromString),io.circe.Encoder.encodeString.contramap(toString))
