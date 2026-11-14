package services.events.tables.chart_reveals

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object ChartRevealsTableInitializer:
  private val initializeV4Sql = """CREATE TABLE chart_reveals (
  event_id text NOT NULL REFERENCES events(id),
  chart_key text NOT NULL,
  match_id text NOT NULL REFERENCES matches(id),
  revealed_by text NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id,chart_key)
);
INSERT INTO chart_reveals(event_id,chart_key,match_id,revealed_by)
SELECT DISTINCT ON (m.event_id,p.chart_key) m.event_id,p.chart_key,m.id,e.owner_id
FROM play_slots p JOIN matches m ON m.id=p.match_id JOIN events e ON e.id=m.event_id
JOIN pool_entries c ON c.event_id=m.event_id AND c.chart_key=p.chart_key
WHERE c.metadata->>'role' ~ '(^|[|,])mystery([|,]|$)'
ORDER BY m.event_id,p.chart_key,m.id;"""
  def initializeV4(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV4Sql).run(())).void

