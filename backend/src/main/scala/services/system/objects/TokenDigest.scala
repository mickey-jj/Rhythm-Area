package services.system.objects

object TokenDigest:
  def apply(token: String): String =
    java.security.MessageDigest.getInstance("SHA-256")
      .digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8))
      .map(b => f"${b & 0xff}%02x").mkString
