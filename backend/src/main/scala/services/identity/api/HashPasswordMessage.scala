package services.identity.api
import cats.effect.IO
import java.sql.Connection
import services.system.api.APIMessage
import services.identity.utils.Passwords
final case class HashPasswordMessage(password: String) extends APIMessage[String]:
  def plan(connection: Connection): IO[String] = Passwords.hash(password)
