package services.system.routes

import cats.effect.IO
import org.http4s.Request
import services.events.objects.{AppError, ApiError}
import scala.concurrent.duration.*

object RequestBody:
  def read(request: Request[IO]): IO[Request[IO]] =
    if request.contentLength.exists(_ > 16*1024*1024) then IO.raiseError(AppError(413,ApiError("BODY_TOO_LARGE","请求超过 16MB")))
    else request.body.take(16*1024*1024+1L).compile.toVector.flatMap { bytes =>
      if bytes.size > 16*1024*1024 then IO.raiseError(AppError(413,ApiError("BODY_TOO_LARGE","请求超过 16MB")))
      else IO.pure(request.withBodyStream(fs2.Stream.emits(bytes).covary[IO]))
    }.timeoutTo(20.seconds,IO.raiseError(AppError(408,ApiError("REQUEST_TIMEOUT","请求上传超时，请重试"))))
