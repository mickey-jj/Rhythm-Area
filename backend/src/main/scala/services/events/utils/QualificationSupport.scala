package services.events.utils

import cats.effect.IO
import io.circe.Json
import io.circe.syntax.*
import java.sql.Connection
import services.events.objects.QualificationDecisionStatus
import services.events.objects.apiTypes.{QualificationDecision, RankingRow}
import services.events.tables.qualification_orders.QualificationOrdersTable
import services.system.objects.TokenDigest

private[events] object QualificationSupport:
  private[events] def snapshot(rows: List[RankingRow]): Json =
    rows.map { row =>
      Json.obj(
        "entryId" -> row.entry.id.asJson,
        "total" -> row.total.asJson,
        "complete" -> row.complete.asJson,
        "rank" -> row.rank.asJson,
        "attemptIds" -> row.attemptIds.distinct.sorted.asJson
      )
    }.asJson

  private[events] def snapshotKey(snapshot: Json): String = TokenDigest(snapshot.noSpaces)

  private def legacySnapshot(rows: List[RankingRow]): Json =
    rows.map(row => Map("entryId" -> row.entry.id, "total" -> row.total.getOrElse(""))).asJson

  private[events] def validOrder(rows: List[RankingRow], order: List[String]): Boolean =
    val ranks = rows.flatMap(row => row.rank.map(row.entry.id -> _)).toMap
    val orderedRanks = order.flatMap(ranks.get)
    ranks.size == rows.size && order.size == rows.size &&
      order.distinct.size == rows.size && orderedRanks.size == rows.size &&
      orderedRanks == orderedRanks.sorted

  private[events] def decision(connection: Connection, eventId: String, rows: List[RankingRow]): IO[Option[QualificationDecision]] =
    val ranked = rows.filter(_.complete)
    val totals = ranked.flatMap(_.total.flatMap(Engine.decimal))
    if totals.distinct.size == totals.size then IO.pure(None)
    else
      val current = snapshot(rows)
      QualificationOrdersTable.findServiceGenerate(connection, eventId).map { stored =>
        val order = stored.flatMap { (savedSnapshot, savedOrder) =>
          val snapshotMatches = io.circe.parser.parse(savedSnapshot).toOption.exists { saved =>
            saved == current || saved == legacySnapshot(rows)
          }
          Option.when(snapshotMatches)(savedOrder)
            .flatMap(io.circe.parser.decode[List[String]](_).toOption)
            .filter(validOrder(ranked, _))
        }
        val status = if order.nonEmpty then QualificationDecisionStatus.Resolved
          else if stored.nonEmpty then QualificationDecisionStatus.Stale
          else QualificationDecisionStatus.Required
        Some(QualificationDecision(status, snapshotKey(current), order))
      }
