import { ANSWER_OPTIONS, TEST_QUESTIONS } from "./constants";

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

function calculateAge(birthDate: string): number | null {
  const [dayRaw, monthRaw, yearRaw] = birthDate.split(".");
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (!day || !month || !year) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  const dayDiff = today.getDate() - day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
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
  const age = calculateAge(params.birthDate);
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
    `📊 Результат теста: <b>${params.score} баллов</b>`,
    "",
    "📝 Детали ответов:",
    details
  ].join("\n");
}
