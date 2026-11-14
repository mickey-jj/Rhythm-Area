package services.events.utils
import org.http4s.Uri
import services.events.objects.ArtworkFormat

private[events] object ArtworkValidation:
  private[events] def validSource(value: Option[String]): Boolean = value.forall { source =>
    source.length <= 2048 && (source.matches("^/api/artwork/[a-f0-9]{64}\\.(png|jpg|webp)$") ||
      Uri.fromString(source).exists(uri => uri.scheme.exists(s => s.value == "https" || s.value == "http") && uri.authority.exists(a => a.host.value.nonEmpty && a.userInfo.isEmpty)))
  }
  private[events] def format(bytes: Vector[Byte]): Option[ArtworkFormat] =
    val prefix = bytes.take(12).map(b => b & 255).toList
    if prefix.take(8) == List(137,80,78,71,13,10,26,10) then Some(ArtworkFormat.Png)
    else if prefix.take(3) == List(255,216,255) then Some(ArtworkFormat.Jpeg)
    else if prefix.take(4) == List(82,73,70,70) && prefix.drop(8).take(4) == List(87,69,66,80) then Some(ArtworkFormat.Webp)
    else None
