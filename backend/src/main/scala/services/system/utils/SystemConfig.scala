package services.system.utils

import java.nio.file.Path

object SystemConfig:
  val root: Path = Path.of(sys.env.getOrElse("AREA_ROOT", "..")).toAbsolutePath.normalize
  val password: String = sys.env.getOrElse("DB_PASSWORD", "")
  private val databaseIdentity = sys.env.getOrElse("DB_NAME","rhythm_area_single")
  val evidenceDirectory: Path = root.resolve(".local/evidence").resolve(services.system.objects.TokenDigest(databaseIdentity).take(24))
