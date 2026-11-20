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

final class IdentityBoundary(connection: Connection):
  private val jdbc = s"jdbc:postgresql://${sys.env.getOrElse("DB_HOST","127.0.0.1")}:${sys.env.getOrElse("DB_PORT","55432")}/${sys.env.getOrElse("DB_NAME","rhythm_area_single")}"
  private val secureCookie = sys.env.getOrElse("APP_ORIGIN","http://127.0.0.1:5174").startsWith("https://")
  val cookieName = (if secureCookie then "__Host-area_session_" else "area_session_")+services.system.objects.TokenDigest(jdbc).take(12)
  private val allowedOrigins = Set(sys.env.getOrElse("APP_ORIGIN","http://127.0.0.1:5174"),"http://localhost:5174")

  def token(req: Request[IO]): Option[String] = req.cookies.find(_.name == cookieName).map(_.content)
  def current(req: Request[IO]): IO[Option[Session]] = token(req).traverse(t => ReadSessionMessage(services.system.objects.TokenDigest(t)).plan(connection)).map(_.flatten)
  def auth(req: Request[IO]): IO[Session] = current(req).flatMap(_.liftTo[IO](AppError(401,ApiError("UNAUTHENTICATED","请先登录"))))
  def origin(req: Request[IO]): IO[Unit] = IO.raiseUnless(req.headers.get(CIString("Origin")).exists(h => allowedOrigins.contains(h.head.value)))(AppError(403,ApiError("ORIGIN_REJECTED","请求来源不受信任")))
  def write(req: Request[IO]): IO[User] = for
    _ <- origin(req)
    s <- auth(req)
    _ <- IO.raiseUnless(req.headers.get(CIString("X-Area-CSRF")).exists(_.head.value == s.csrf))(AppError(403,ApiError("CSRF_REJECTED","安全令牌已过期，请刷新页面")))
  yield s.user
  def respond[A: io.circe.Encoder](value: IO[A]): IO[Response[IO]] = value.flatMap(v => Ok(v.asJson))
  def loggedIn(user: User): IO[Response[IO]] = for
    grant <- IssueSessionMessage(user).plan(connection)
    response <- Ok(grant.session.asJson)
  yield response.addCookie(ResponseCookie(cookieName,grant.token,httpOnly=true,secure=secureCookie,sameSite=Some(SameSite.Strict),path=Some("/"),maxAge=Some(86400)))
