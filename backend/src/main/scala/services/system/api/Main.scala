package services.system.api

import cats.effect.{IO, Resource}
import cats.syntax.all.*
import java.sql.Connection
import java.nio.file.{Files, Path}
import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import services.system.api.*
import services.system.utils.*
import org.typelevel.doobie.*
import org.typelevel.doobie.implicits.*
import org.typelevel.doobie.hikari.HikariTransactor
import cats.effect.IOApp
import com.comcast.ip4s.*
import org.http4s.ember.server.EmberServerBuilder
import services.system.routes.Router
import scala.concurrent.duration.*
object Main extends IOApp.Simple:
  private val root=SystemConfig.root
  private def environment(key:String, fallback:String)=sys.env.getOrElse(key,fallback)
  private val jdbc=s"jdbc:postgresql://${environment("DB_HOST","127.0.0.1")}:${environment("DB_PORT","55432")}/${environment("DB_NAME","rhythm_area_single")}"
  private val password=SystemConfig.password

  private def database(user: String, secret: String): Resource[IO,HikariTransactor[IO]] =
    Resource.eval(IO.blocking {
      val config = new com.zaxxer.hikari.HikariConfig()
      config.setDriverClassName("org.postgresql.Driver")
      config.setJdbcUrl(jdbc)
      config.setUsername(user)
      config.setPassword(secret)
      config.setMaximumPoolSize(3)
      config.setMinimumIdle(1)
      config
    }).flatMap(config => HikariTransactor.fromHikariConfig[IO](config))

  def run: IO[Unit] =
    database(environment("DB_MIGRATION_USER","area"),password).use { xa =>
      Database.transaction(xa)(c=>InitializeDatabaseMessage().plan(c) *> services.system.tables.schema_migrations.SchemaMigrationsTable.grantRuntimeAccess(c).void)
    } *> IO.blocking(sys.env.getOrElse("DB_RUNTIME_PASSWORD",Files.readString(root.resolve(".local/runtime-password")).trim)).flatMap { runtimePassword =>
    database(environment("DB_USER","area_app"),runtimePassword).use { xa =>
      for
        safe <- Database.transaction(xa)(services.system.tables.schema_migrations.SchemaMigrationsTable.safeRuntimeRole)
        _ <- IO.raiseUnless(safe)(new IllegalStateException("Business connections require a non-administrative database role"))
        _ <- Database.transaction(xa)(MaintainEvidenceMessage().plan)
        port <- IO.fromOption(Port.fromString(environment("HTTP_PORT","8082")))(new IllegalArgumentException("Invalid HTTP_PORT"))
        throttle <- services.identity.routes.LoginThrottle.create
        app = services.system.routes.ErrorBoundary(org.http4s.HttpApp[IO](request => services.system.routes.RequestBody.read(request).flatMap { buffered =>
          val resolved=services.system.routes.CanonicalRoutes.resolve(buffered)
          throttle.check(resolved) *> Database.transaction(xa)(connection => Router(connection)(resolved))
        }))
        _ <- (IO.sleep(1.hour) *> Database.transaction(xa)(MaintainEvidenceMessage().plan).handleErrorWith(_=>IO.println("证据过期清理失败，将在下一周期重试"))).foreverM.background.use { _ =>
          EmberServerBuilder.default[IO].withHost(ipv4"127.0.0.1").withPort(port).withHttpApp(app).withShutdownTimeout(2.seconds).build.use(_ => IO.println(s"Rhythm Area API ready at http://127.0.0.1:$port") *> IO.never)
        }
      yield ()
    }
    }
