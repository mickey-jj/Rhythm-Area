package services.events.api

import cats.effect.{IO,Resource}
import cats.syntax.all.*
import java.sql.Connection
import java.nio.file.Files
import scala.jdk.CollectionConverters.*
import services.events.tables.evidence_files.EvidenceFilesTable
import services.system.api.NoRequestMessage
import services.system.utils.SystemConfig

final case class MaintainEvidenceMessage() extends NoRequestMessage[Unit]:
  def plan(connection: Connection): IO[Unit] = for
    expired <- EvidenceFilesTable.expireUnlinked(connection)
    retained <- EvidenceFilesTable.retainedIds(connection).map(_.toSet)
    directory=SystemConfig.evidenceDirectory
    _ <- expired.traverse_(id=>IO.blocking(Files.deleteIfExists(directory.resolve(id))).void)
    now <- IO.realTime.map(_.toMillis)
    exists <- IO.blocking(Files.isDirectory(directory))
    _ <- if !exists then IO.unit else Resource.fromAutoCloseable(IO.blocking(Files.list(directory))).use { stream =>
      IO.blocking(stream.iterator.asScala.toList).flatMap(_.filter(p=>p.getFileName.toString.matches("[a-f0-9-]{36}") && !retained(p.getFileName.toString)).traverse_ { path =>
        IO.blocking(Files.getLastModifiedTime(path).toMillis).flatMap(stamp=>if now-stamp>86400000 then IO.blocking(Files.deleteIfExists(path)).void else IO.unit)
      })
    }
  yield ()
