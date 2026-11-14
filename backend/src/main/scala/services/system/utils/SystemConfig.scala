package services.system.utils

import java.nio.file.Path

object SystemConfig:
  val root: Path = Path.of(sys.env.getOrElse("AREA_ROOT", "..")).toAbsolutePath.normalize
  val password: String = sys.env.getOrElse("DB_PASSWORD", "")
