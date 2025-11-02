import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const dataDir = path.join(process.cwd(), 'backend', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}
const dbPath = path.join(dataDir, 'app.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  username TEXT,
  profile_image TEXT,
  age INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  destination TEXT NOT NULL,
  date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  amount REAL NOT NULL,
  deadline TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('universal','private')),
  code TEXT UNIQUE,
  organizer TEXT NOT NULL,
  organizer_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  joined_at TEXT DEFAULT (datetime('now')),
  UNIQUE(trip_id, wallet_address),
  FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trips_type ON trips(type);
CREATE INDEX IF NOT EXISTS idx_trips_code ON trips(code);
CREATE INDEX IF NOT EXISTS idx_part_trip ON participants(trip_id);
`)

export default db
