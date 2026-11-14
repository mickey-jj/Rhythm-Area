package services.system.routes
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import org.http4s.*
import services.events.objects.*
object Router:
  def apply(connection: Connection): HttpApp[IO] =
    val http = (services.identity.routes.IdentityRoutes(connection) <+> services.instance.routes.InstanceRoutes(connection) <+> services.events.routes.EventsRoutes(connection) <+> SystemRoutes(connection)).orNotFound
    HttpApp[IO] { request =>
      if request.contentLength.exists(_>16*1024*1024) then IO.raiseError(AppError(413,ApiError("BODY_TOO_LARGE","请求超过 16MB")))
      else request.body.take(16*1024*1024+1L).compile.toVector.flatMap { bytes =>
        if bytes.size>16*1024*1024 then IO.raiseError(AppError(413,ApiError("BODY_TOO_LARGE","请求超过 16MB")))
        else http(request.withBodyStream(fs2.Stream.emits(bytes).covary[IO]))
      }
    }
