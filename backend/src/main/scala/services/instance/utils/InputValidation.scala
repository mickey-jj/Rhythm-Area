package services.instance.utils
import cats.effect.IO
import io.circe.{Encoder,Decoder}
import io.circe.syntax.*
import services.events.objects.*
private[instance] object InputValidation:
  private[instance] def check(condition: Boolean,status: Int,code: String,message: String): IO[Unit] = IO.raiseUnless(condition)(AppError(status,ApiError(code,message)))
  private[instance] def json[A: Encoder](value: A): String = value.asJson.noSpaces
  private[instance] def readJson[A: Decoder](text: String): A = io.circe.parser.decode[A](text).fold(error=>throw new IllegalStateException(error.getMessage),identity)
