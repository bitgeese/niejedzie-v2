-- niejedzie.pl v2 SQLite schema
-- No delay_snapshots table (that was the v1 $550 mistake).

CREATE TABLE IF NOT EXISTS stats (
  key TEXT PRIMARY KEY,
  data JSON NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS active_trains (
  operating_date TEXT NOT NULL,
  train_number TEXT NOT NULL,
  carrier TEXT,
  route_start TEXT,
  route_end TEXT,
  is_delayed INTEGER DEFAULT 0,
  max_delay INTEGER DEFAULT 0,
  schedule_id INTEGER,
  order_id INTEGER,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (operating_date, train_number)
);

CREATE INDEX IF NOT EXISTS idx_active_trains_delayed
  ON active_trains (is_delayed, max_delay DESC);

CREATE TABLE IF NOT EXISTS train_routes (
  operating_date TEXT NOT NULL,
  train_number TEXT NOT NULL,
  stop_sequence INTEGER NOT NULL,
  station_name TEXT,
  station_id INTEGER,
  arrival_time TEXT,
  departure_time TEXT,
  PRIMARY KEY (operating_date, train_number, stop_sequence)
);

CREATE INDEX IF NOT EXISTS idx_train_routes_station
  ON train_routes (station_name);

CREATE TABLE IF NOT EXISTS monitoring_sessions (
  id TEXT PRIMARY KEY,
  train_number TEXT NOT NULL,
  destination TEXT NOT NULL,
  push_subscription TEXT,
  stripe_session_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_type TEXT,
  status TEXT DEFAULT 'pending',
  operating_date TEXT,
  last_push_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_active
  ON monitoring_sessions (status, operating_date) WHERE status = 'active';
