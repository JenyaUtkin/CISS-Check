import { db } from "./database";
import { TestResult, UserProfile } from "../types";

type UserRow = {
  telegram_id: number;
  full_name: string;
  birth_date: string;
  username: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

type TestResultRow = {
  id: number;
  telegram_id: number;
  score: number;
  answers_json: string;
  completed_at: string;
};

export function getUserProfile(telegramId: number): UserProfile | null {
  const stmt = db.prepare("SELECT * FROM users WHERE telegram_id = ?");
  const row = stmt.get(telegramId) as UserRow | undefined;
  if (!row) {
    return null;
  }

  return {
    telegramId: row.telegram_id,
    fullName: row.full_name,
    birthDate: row.birth_date,
    username: row.username,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function upsertUserProfile(params: {
  telegramId: number;
  fullName: string;
  birthDate: string;
  username?: string | null;
  phone?: string | null;
}): void {
  const now = new Date().toISOString();
  const existing = getUserProfile(params.telegramId);
  const username = params.username === undefined ? existing?.username || null : params.username;
  const phone = params.phone === undefined ? existing?.phone || null : params.phone;

  const stmt = db.prepare(`
    INSERT INTO users (telegram_id, full_name, birth_date, username, phone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      full_name = excluded.full_name,
      birth_date = excluded.birth_date,
      username = excluded.username,
      phone = excluded.phone,
      updated_at = excluded.updated_at
  `);
  stmt.run(params.telegramId, params.fullName, params.birthDate, username, phone, now, now);
}

export function deleteUserProfile(telegramId: number): void {
  const stmt = db.prepare("DELETE FROM users WHERE telegram_id = ?");
  stmt.run(telegramId);
}

export function saveTestResult(result: Omit<TestResult, "id">): void {
  const stmt = db.prepare(`
    INSERT INTO test_results (telegram_id, score, answers_json, completed_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(result.telegramId, result.score, JSON.stringify(result.answers), result.completedAt);
}

export function getLatestTestResult(telegramId: number): TestResult | null {
  const stmt = db.prepare(`
    SELECT * FROM test_results
    WHERE telegram_id = ?
    ORDER BY id DESC
    LIMIT 1
  `);
  const row = stmt.get(telegramId) as TestResultRow | undefined;
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    telegramId: row.telegram_id,
    score: row.score,
    answers: JSON.parse(row.answers_json) as number[],
    completedAt: row.completed_at
  };
}
