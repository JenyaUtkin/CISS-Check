import { db } from "./database";
import { UserSession, UserState } from "../types";

type SessionRow = {
  telegram_id: number;
  state: string;
  current_question: number;
  answers_json: string;
  temp_full_name: string | null;
  updated_at: string;
};

function toSession(row: SessionRow): UserSession {
  return {
    telegramId: row.telegram_id,
    state: row.state as UserState,
    currentQuestion: row.current_question,
    answers: JSON.parse(row.answers_json) as number[],
    tempFullName: row.temp_full_name,
    updatedAt: row.updated_at
  };
}

export function getOrCreateSession(telegramId: number): UserSession {
  const existing = db
    .prepare("SELECT * FROM sessions WHERE telegram_id = ?")
    .get(telegramId) as SessionRow | undefined;

  if (existing) {
    return toSession(existing);
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO sessions (telegram_id, state, current_question, answers_json, temp_full_name, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(telegramId, UserState.AWAITING_NAME_PERMISSION, 0, "[]", null, now);

  return {
    telegramId,
    state: UserState.AWAITING_NAME_PERMISSION,
    currentQuestion: 0,
    answers: [],
    tempFullName: null,
    updatedAt: now
  };
}

export function updateSession(
  telegramId: number,
  updates: Partial<Pick<UserSession, "state" | "currentQuestion" | "answers" | "tempFullName">>
): UserSession {
  const current = getOrCreateSession(telegramId);
  const next: UserSession = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  db.prepare(`
    UPDATE sessions
    SET state = ?, current_question = ?, answers_json = ?, temp_full_name = ?, updated_at = ?
    WHERE telegram_id = ?
  `).run(next.state, next.currentQuestion, JSON.stringify(next.answers), next.tempFullName, next.updatedAt, telegramId);

  return next;
}

export function resetTestProgress(telegramId: number, nextState: UserState = UserState.READY_FOR_TEST): UserSession {
  return updateSession(telegramId, {
    state: nextState,
    currentQuestion: 0,
    answers: []
  });
}
