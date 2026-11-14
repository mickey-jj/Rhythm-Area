package services.identity.utils

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
import java.security.{MessageDigest, SecureRandom}
import java.util.{Base64, UUID}
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

private[identity] object Passwords:
  private val iterations = 210000
  private def derive(password: String, salt: Array[Byte], rounds: Int): Array[Byte] =
    SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(new PBEKeySpec(password.toCharArray, salt, rounds, 256)).getEncoded
  private[identity] def hash(password: String): IO[String] = IO.blocking {
    val salt = SecureRandom.getSeed(16)
    val encoder = Base64.getEncoder
    s"$iterations:${encoder.encodeToString(salt)}:${encoder.encodeToString(derive(password,salt,iterations))}"
  }
  private[identity] def verify(password: String, encoded: String): IO[Boolean] = IO.blocking {
    val parts = encoded.split(":")
    parts.length == 3 && MessageDigest.isEqual(Base64.getDecoder.decode(parts(2)), derive(password, Base64.getDecoder.decode(parts(1)), parts(0).toInt))
  }.handleError(_ => false)
  private[identity] def tokenHash(token: String): String = MessageDigest.getInstance("SHA-256").digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)).map(b => f"${b & 0xff}%02x").mkString
  private[identity] def newId: IO[String] = IO(UUID.randomUUID().toString)
