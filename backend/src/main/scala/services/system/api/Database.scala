package services.system.api

import cats.effect.IO
import cats.syntax.all.*
import org.typelevel.doobie.*
import java.sql.Connection

object Database:
  def run[A](connection: Connection)(query: ConnectionIO[A]): IO[A] =
    query.foldMap(org.typelevel.doobie.free.KleisliInterpreter[IO](org.typelevel.doobie.util.log.LogHandler.noop[IO]).ConnectionInterpreter).run(connection)

  def transaction[A](xa: Transactor[IO])(plan: Connection => IO[A]): IO[A] =
    xa.connect(xa.kernel).use { connection =>
      IO.uncancelable { poll =>
        IO.blocking(connection.setAutoCommit(false)) *> poll(plan(connection)).onCancel(IO.blocking(connection.rollback())).attempt.flatMap {
        case Right(value) => IO.blocking(connection.commit()).as(value)
        case Left(error) => IO.blocking(connection.rollback()).attempt *> IO.raiseError(error)
        }
      }
    }
