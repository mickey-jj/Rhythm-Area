package services.system.routes
import cats.effect.IO
import cats.syntax.all.*
import org.http4s.*
import org.http4s.circe.*
import org.typelevel.ci.CIString
import io.circe.syntax.*
import services.events.objects.*
object ErrorBoundary:
  def apply(app: HttpApp[IO]): HttpApp[IO] = HttpApp[IO] { request =>
    app(request)
        .handleErrorWith {
          case AppError(status,error) => IO.pure(Response[IO](Status.fromInt(status).getOrElse(Status.InternalServerError)).withEntity(error.asJson))
          case _: org.http4s.DecodeFailure => IO.pure(Response[IO](Status.BadRequest).withEntity(ApiError("INVALID_JSON","请求格式不正确，请检查字段").asJson))
          case e => IO.println(s"[API failure] ${e.getClass.getSimpleName}: ${e.getMessage}") *> IO.pure(Response[IO](Status.InternalServerError).withEntity(ApiError("INTERNAL_ERROR","服务暂时无法完成请求，请查看后端日志").asJson))
        }.map { response =>
          val guarded=response.putHeaders(Header.Raw(CIString("X-Content-Type-Options"),"nosniff"))
          if response.status.isSuccess && response.headers.get(CIString("Cache-Control")).nonEmpty then guarded
          else guarded.putHeaders(Header.Raw(CIString("Cache-Control"),"no-store"))
        }
  }
