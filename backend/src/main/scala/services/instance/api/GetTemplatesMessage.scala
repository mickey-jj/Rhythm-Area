package services.instance.api

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


import services.instance.utils.InputValidation.*
import services.instance.utils.*

final case class GetTemplatesMessage(authenticatedUser: User) extends APIMessage[List[TemplatePreset]]:
  def plan(connection: Connection): IO[List[TemplatePreset]] =
    import Assets.*
    val root = SystemConfig.root
    (for
        u <- IO.pure(authenticatedUser)
        _ <- InstanceRequireOwnerMessage(u).plan(connection)
        examples <- List(("paradigm-reboot","范式起源 · 演示配置"),("custom","自定义游戏 · 达成率"),("cop-2025","COP 2025 · 第二轮预选参考"),("kop-7th","KOP 7th · maimai 全国决赛"),("pmt-2026","PMT 2026 · 前段对局参考"),("wec-2026","WEC 2026 · 中二节奏海选排名参考")).traverse { (id,label) =>
          val path=root.resolve(s"examples/$id/template.json")
          IO.blocking(Files.exists(path)).flatMap(exists => if exists then read[Json](path).map(j => Some(j.deepMerge(Json.obj("id"->id.asJson,"presetLabel"->label.asJson)))) else IO.pure(None))
        }
      yield Json.obj("id"->"blank".asJson,"name"->"".asJson,"presetLabel"->"从空白开始".asJson,"tagline"->"".asJson,"description"->"".asJson,"rules"->Defaults.rules.asJson,"charts"->List.empty[Chart].asJson,"appearance"->Appearance.default.asJson) :: examples.flatten).flatMap(_.traverse(json => IO.fromEither(json.as[TemplatePreset])))
