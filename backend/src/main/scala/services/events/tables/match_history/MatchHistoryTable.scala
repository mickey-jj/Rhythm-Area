package services.events.tables.match_history

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
import org.typelevel.doobie.implicits.*

object MatchHistoryTable:
  private val insertOperationsReplaytxSql = """insert into match_history(match_id,generation,snapshot,reason,user_id) select ?,?,jsonb_build_object('match',to_jsonb(m),'draft',(select coalesce(jsonb_agg(d),'[]') from draft_actions d where d.match_id=?),'slots',(select coalesce(jsonb_agg(s),'[]') from play_slots s where s.match_id=?),'lineups',(select coalesce(jsonb_agg(l),'[]') from lineups l where l.match_id=?)),?,? from matches m where m.id=?"""
  def insertOperationsReplaytx(connection: Connection, parameter1: String, parameter2: Int, matchId: String, matchId2: String, matchId3: String, parameter6: String, parameter7: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,Int,String,String,String,String,String,String)](insertOperationsReplaytxSql).run((parameter1,parameter2,matchId,matchId2,matchId3,parameter6,parameter7,id)))
