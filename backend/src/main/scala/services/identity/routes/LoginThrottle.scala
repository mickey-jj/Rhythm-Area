package services.identity.routes

import cats.effect.{IO, Ref}
import cats.syntax.all.*
import org.http4s.Request
import io.circe.parser.parse
import services.events.objects.{AppError, ApiError}

final class LoginThrottle private (windows: Ref[IO,Map[String,(Long,Int)]]):
  def check(request: Request[IO]): IO[Unit] =
    if request.method.name != "POST" || request.uri.path.renderString != "/api/auth/login" then IO.unit
    else for
      body <- request.bodyText.compile.string
      account = parse(body).toOption.flatMap(_.hcursor.get[String]("username").toOption).getOrElse("").trim.toLowerCase.take(32)
      now <- IO.monotonic.map(_.toMillis)
      allowed <- windows.modify { state =>
        val active=state.filter((_,value)=>now-value._1<300000)
        val key="account:"+account
        val count=active.get(key).map(_._2).getOrElse(0)
        val source="source:"+request.remoteAddr.map(_.toString).getOrElse("unknown")
        val sourceCount=active.get(source).map(_._2).getOrElse(0)
        val next=active.updated(key,(active.get(key).map(_._1).getOrElse(now),count+1)).updated(source,(active.get(source).map(_._1).getOrElse(now),sourceCount+1))
        (if active.size>=20000 then state else next,count<8 && sourceCount<300 && active.size<20000)
      }
      _ <- IO.raiseUnless(allowed)(AppError(429,ApiError("LOGIN_LIMIT","登录尝试过于频繁，请五分钟后重试")))
    yield ()

object LoginThrottle:
  def create: IO[LoginThrottle] = Ref.of[IO,Map[String,(Long,Int)]](Map.empty).map(new LoginThrottle(_))
