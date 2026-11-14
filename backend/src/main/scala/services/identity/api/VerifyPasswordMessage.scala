package services.identity.api
import cats.effect.IO
import java.sql.Connection
import services.system.api.APIMessage
import services.identity.utils.Passwords
final case class VerifyPasswordMessage(password: String, encoded: String) extends APIMessage[Boolean]:
  def plan(connection: Connection): IO[Boolean] = Passwords.verify(password,encoded)
