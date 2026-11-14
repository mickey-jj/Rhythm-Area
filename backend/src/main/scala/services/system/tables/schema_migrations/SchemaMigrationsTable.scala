package services.system.tables.schema_migrations
import cats.effect.IO
import java.sql.Connection
import services.system.api.Database
object SchemaMigrationsTable:
  private val existsSql = "select to_regclass('public.schema_migrations') is not null"
  def exists(connection: Connection): IO[Boolean] = Database.run(connection)(org.typelevel.doobie.Query[Unit,Boolean](existsSql).unique(()))
  private val appliedSql = "select exists(select 1 from schema_migrations where version=?)"
  def applied(connection: Connection, version: Int): IO[Boolean] = Database.run(connection)(org.typelevel.doobie.Query[Int,Boolean](appliedSql).unique(version))
