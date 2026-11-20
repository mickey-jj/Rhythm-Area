package services.system.api

import cats.effect.IO
import cats.syntax.all.*
import org.typelevel.doobie.*
import java.sql.Connection

object Database:
  def run[A](connection: Connection)(query: ConnectionIO[A]): IO[A] =
    query.foldMap(org.typelevel.doobie.free.KleisliInterpreter[IO](org.typelevel.doobie.util.log.LogHandler.noop[IO]).ConnectionInterpreter).run(connection)

  def transaction[A](xa: Transactor[IO])(plan: Connection => IO[A]): IO[A] =
    IO.monotonic.flatMap { waitingSince => xa.connect(xa.kernel).use { connection =>
      val measure=if sys.env.get("AREA_DB_METRICS").contains("1") then IO.monotonic.flatMap(now=>IO.println(s"DB_WAIT_MS:${(now-waitingSince).toNanos.toDouble/1000000}")) else IO.unit
      measure *>
      IO.uncancelable { poll =>
        IO.blocking(connection.setAutoCommit(false)) *> poll(plan(connection)).onCancel(IO.blocking(connection.rollback())).attempt.flatMap {
        case Right(value) => IO.blocking(connection.commit()).as(value)
        case Left(error) => IO.blocking(connection.rollback()).attempt *> IO.raiseError(error)
        }
      }
    }
    }
