import { ANSWER_OPTIONS, TEST_QUESTIONS } from "./constants";
import { formatScoreWithBallWord, getAgeFromBirthDate } from "./ciss";

export function answerLabelByScore(score: number): string {
  const option = ANSWER_OPTIONS.find((item) => item.score === score);
  return option?.label || "Неизвестно";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDoctorsGroupMessage(params: {
  fullName: string;
  birthDate: string;
  username: string | null;
  phone: string | null;
  telegramId: number;
  score: number;
  answers: number[];
}): string {
  const age = getAgeFromBirthDate(params.birthDate);
  const usernameSuffix = params.username ? ` (@${escapeHtml(params.username)})` : "";
  const birthDateWithAge = age === null ? params.birthDate : `${params.birthDate} (${age} лет)`;
  const phoneText = params.phone ? escapeHtml(params.phone) : "не указан";

  const details = TEST_QUESTIONS.map((question, index) => {
    const score = params.answers[index];
    const label = answerLabelByScore(score);
    return `${index + 1}. ${escapeHtml(question)} — <b>${escapeHtml(label)}(${score})</b>`;
  }).join("\n");

  return [
    "📋 Новая анкета пациента",
    "",
    `👤 ФИО: ${escapeHtml(params.fullName)}${usernameSuffix}`,
    `🎂 Дата рождения: ${escapeHtml(birthDateWithAge)}`,
    `📞 Телефон: ${phoneText}`,
    "",
    `📊 Результат теста: <b>${escapeHtml(formatScoreWithBallWord(params.score))}</b>`,
    "",
    "📝 Детали ответов:",
    details
  ].join("\n");
}
