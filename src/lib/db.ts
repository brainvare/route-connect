import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'bni.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS regions (
      region_id INTEGER PRIMARY KEY AUTOINCREMENT,
      region_name TEXT UNIQUE NOT NULL,
      domain TEXT,
      total_chapters INTEGER DEFAULT 0,
      total_members INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chapters (
      chapter_id INTEGER PRIMARY KEY,
      chapter_name TEXT NOT NULL,
      region_id INTEGER,
      venue_name TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      latitude REAL,
      longitude REAL,
      meeting_day TEXT,
      meeting_time TEXT,
      meeting_schedule TEXT,
      total_members INTEGER DEFAULT 0,
      domain TEXT,
      detail_url TEXT,
      org_type TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (region_id) REFERENCES regions(region_id)
    );

    CREATE TABLE IF NOT EXISTS members (
      member_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      profession TEXT,
      profession_category TEXT,
      company_name TEXT,
      city TEXT,
      chapter_id INTEGER,
      region_id INTEGER,
      domain TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id),
      FOREIGN KEY (region_id) REFERENCES regions(region_id)
    );

    CREATE INDEX IF NOT EXISTS idx_chapters_region ON chapters(region_id);
    CREATE INDEX IF NOT EXISTS idx_chapters_lat_lng ON chapters(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_chapters_city ON chapters(city);
    CREATE INDEX IF NOT EXISTS idx_chapters_meeting_day ON chapters(meeting_day);
    CREATE INDEX IF NOT EXISTS idx_members_chapter ON members(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_members_region ON members(region_id);
    CREATE INDEX IF NOT EXISTS idx_members_profession ON members(profession_category);
    CREATE INDEX IF NOT EXISTS idx_members_city ON members(city);
    CREATE INDEX IF NOT EXISTS idx_members_name ON members(full_name);
    CREATE INDEX IF NOT EXISTS idx_members_company ON members(company_name);
  `);

  return db;
}
