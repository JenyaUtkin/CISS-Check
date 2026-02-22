import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config";

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    username TEXT,
    phone TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    telegram_id INTEGER PRIMARY KEY,
    state TEXT NOT NULL,
    current_question INTEGER NOT NULL DEFAULT 0,
    answers_json TEXT NOT NULL DEFAULT '[]',
    temp_full_name TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    answers_json TEXT NOT NULL,
    completed_at TEXT NOT NULL
  );
`);

const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
const hasUsernameColumn = userColumns.some((column) => column.name === "username");
const hasPhoneColumn = userColumns.some((column) => column.name === "phone");

if (!hasUsernameColumn) {
  db.exec("ALTER TABLE users ADD COLUMN username TEXT");
}

if (!hasPhoneColumn) {
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
}
