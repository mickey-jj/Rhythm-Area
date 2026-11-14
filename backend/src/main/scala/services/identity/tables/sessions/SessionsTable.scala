package services.identity.tables.sessions

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
import org.typelevel.doobie.implicits.*

object SessionsTable:
  private val findRepositorySessionSql = """select u.id,u.username,u.display_name,s.csrf from sessions s join users u on u.id=s.user_id where s.token_hash=? and s.expires_at>now()"""
  def findRepositorySession(connection: Connection, tokenHash: String): IO[Option[(String,String,String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,String)](findRepositorySessionSql).option(tokenHash))

  private val insertTransportSql = """insert into sessions(token_hash,user_id,csrf,expires_at) values (?,?,?,now()+interval '24 hours')"""
  def insertTransport(connection: Connection, tokenHash: String, userId: String, csrf: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](insertTransportSql).run((tokenHash,userId,csrf)))

  private val deleteTransportSql = """delete from sessions where token_hash=?"""
  def deleteTransport(connection: Connection, tokenHash: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](deleteTransportSql).run(tokenHash))
