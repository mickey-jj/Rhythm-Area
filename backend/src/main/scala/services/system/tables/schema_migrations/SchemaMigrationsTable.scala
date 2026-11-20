package services.system.tables.schema_migrations
import cats.effect.IO
import java.sql.Connection
import services.system.api.Database
object SchemaMigrationsTable:
  private val grantRuntimeAccessSql = """GRANT USAGE ON SCHEMA public TO area_app; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO area_app; GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO area_app; REVOKE ALL ON schema_migrations FROM area_app; REVOKE CREATE ON SCHEMA public FROM PUBLIC;"""
  def grantRuntimeAccess(connection: Connection): IO[Int] = Database.run(connection)(org.typelevel.doobie.Update[Unit](grantRuntimeAccessSql).run(()))
  private val safeRuntimeRoleSql = "select not (rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls) from pg_roles where rolname=current_user"
  def safeRuntimeRole(connection: Connection): IO[Boolean] = Database.run(connection)(org.typelevel.doobie.Query[Unit,Boolean](safeRuntimeRoleSql).unique(()))
  private val existsSql = "select to_regclass('public.schema_migrations') is not null"
  def exists(connection: Connection): IO[Boolean] = Database.run(connection)(org.typelevel.doobie.Query[Unit,Boolean](existsSql).unique(()))
  private val appliedSql = "select exists(select 1 from schema_migrations where version=?)"
  def applied(connection: Connection, version: Int): IO[Boolean] = Database.run(connection)(org.typelevel.doobie.Query[Int,Boolean](appliedSql).unique(version))
