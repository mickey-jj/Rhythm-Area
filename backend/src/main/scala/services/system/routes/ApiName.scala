package services.system.routes
import scala.reflect.ClassTag
object ApiName:
  def of[M: ClassTag]: String = normalize(summon[ClassTag[M]].runtimeClass.getSimpleName.stripSuffix("Message"))
  private def normalize(value: String): String = value.replaceAll("([a-z0-9])([A-Z])", "$1-$2").toLowerCase
