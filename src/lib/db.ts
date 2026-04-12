import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

const DATABASE_PATH = process.env.DATABASE_PATH || "./niejedzie.db";

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  _db = new Database(DATABASE_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("synchronous = NORMAL");
  _db.pragma("foreign_keys = ON");
  return _db;
}

export function migrate(): void {
  const schemaPath = join(process.cwd(), "db/schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  db().exec(schema);
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
