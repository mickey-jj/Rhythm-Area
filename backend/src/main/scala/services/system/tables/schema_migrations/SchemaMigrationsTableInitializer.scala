package services.system.tables.schema_migrations

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object SchemaMigrationsTableInitializer:
  private val initializeV11Sql="INSERT INTO schema_migrations(version) VALUES(11)"
  def initializeV11(c: Connection): IO[Unit] = Database.run(c)(org.typelevel.doobie.Update[Unit](initializeV11Sql).run(())).void
  private val initializeV10Sql="INSERT INTO schema_migrations(version) VALUES(10)"
  def initializeV10(c: Connection): IO[Unit] = Database.run(c)(org.typelevel.doobie.Update[Unit](initializeV10Sql).run(())).void
  private val initializeV9Sql = "INSERT INTO schema_migrations(version) VALUES(9);"
  def initializeV9(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV9Sql).run(())).void
  private val initializeV8Sql = "INSERT INTO schema_migrations(version) VALUES(8);"
  def initializeV8(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV8Sql).run(())).void
  private val initializeV7Sql = "INSERT INTO schema_migrations(version) VALUES(7);"
  def initializeV7(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV7Sql).run(())).void
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS schema_migrations (version INT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
INSERT INTO schema_migrations(version) VALUES (1) ON CONFLICT DO NOTHING;"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

  private val initializeV2Sql = """INSERT INTO schema_migrations(version) VALUES (2) ON CONFLICT DO NOTHING;"""
  def initializeV2(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV2Sql).run(())).void

  private val initializeV3Sql = """INSERT INTO schema_migrations(version) VALUES(3);"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

  private val initializeV4Sql = """INSERT INTO schema_migrations(version) VALUES(4);"""
  def initializeV4(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV4Sql).run(())).void

  private val initializeV5Sql = "INSERT INTO schema_migrations(version) VALUES(5);"
  def initializeV5(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV5Sql).run(())).void


  private val initializeV6Sql = "INSERT INTO schema_migrations(version) VALUES(6);"
  def initializeV6(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV6Sql).run(())).void
