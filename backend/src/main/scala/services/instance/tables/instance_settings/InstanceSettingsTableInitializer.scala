package services.instance.tables.instance_settings

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object InstanceSettingsTableInitializer:
  private val initializeV2Sql = """CREATE TABLE IF NOT EXISTS instance_settings (
 id INT PRIMARY KEY CHECK (id=1),
 owner_id TEXT REFERENCES users(id),
 event_id TEXT UNIQUE REFERENCES events(id),
 appearance JSONB NOT NULL DEFAULT '{"brandName":"律竞","accentColor":"#a3edd1","contact":""}'::jsonb,
 demo_loaded BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO instance_settings(id) VALUES (1) ON CONFLICT DO NOTHING;"""
  def initializeV2(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV2Sql).run(())).void

