package services.identity.routes
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import io.circe.Json
import io.circe.syntax.*
import services.events.objects.*
import services.identity.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import org.http4s.*
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.typelevel.ci.CIString
import services.system.utils.SystemConfig

import services.system.routes.{ApiName, ResourceAlias}

object IdentityRoutes:
  val aliases: Map[String, services.system.routes.ResourceAlias] = Map(
    ApiName.of[services.identity.api.GetMeMessage] -> ResourceAlias(org.http4s.Method.GET, "/me"),
    ApiName.of[services.identity.api.LoginMessage] -> ResourceAlias(org.http4s.Method.POST, "/auth/login"),
    ApiName.of[services.identity.api.RegisterMessage] -> ResourceAlias(org.http4s.Method.POST, "/auth/register"),
    ApiName.of[services.identity.api.LogoutMessage] -> ResourceAlias(org.http4s.Method.POST, "/auth/logout")
  )
  def apply(connection: Connection): HttpRoutes[IO] =
    val identity = new services.identity.routes.IdentityBoundary(connection)
    import identity.*
    def respond[A: io.circe.Encoder](value: IO[A]): IO[Response[IO]] = value.flatMap(v => Ok(v.asJson))
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "api" / "me" => for
        authenticated <- auth(req)
        response <- respond(GetMeMessage(authenticated).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "auth" / "login" => for
        _ <- origin(req)
        input <- req.asJsonDecode[services.identity.objects.Credentials]
        user <- LoginMessage(input).plan(connection)
        response <- loggedIn(user)
      yield response
      case req @ POST -> Root / "api" / "auth" / "register" => for
        _ <- origin(req)
        input <- req.asJsonDecode[services.identity.objects.Credentials]
        user <- RegisterMessage(input).plan(connection)
        response <- loggedIn(user)
      yield response
      case req @ POST -> Root / "api" / "auth" / "logout" => write(req) *> token(req).traverse_(t => LogoutMessage(t).plan(connection)) *> Ok(Json.obj("ok"->true.asJson)).map(_.addCookie(ResponseCookie(cookieName,"",httpOnly=true,sameSite=Some(SameSite.Strict),path=Some("/"),maxAge=Some(0))))
    }
