package services.identity.api
import cats.effect.IO
import java.sql.Connection
import services.system.api.NoRequestMessage
final case class NewIdMessage() extends NoRequestMessage[String]:
  def plan(connection: Connection): IO[String] = IO(java.util.UUID.randomUUID().toString)
