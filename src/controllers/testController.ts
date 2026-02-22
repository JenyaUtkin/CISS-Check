import { Context, Markup } from "telegraf";
import { config } from "../config";
import { getOrCreateSession, resetTestProgress, updateSession } from "../models/sessionModel";
import { getUserProfile, saveTestResult } from "../models/userModel";
import { UserState } from "../types";
import { ANSWER_OPTIONS, RETAKE_TEST_BUTTON, START_TEST_BUTTON, TEST_QUESTIONS } from "../utils/constants";
import { buildDoctorsGroupMessage } from "../utils/formatters";

function getTelegramId(ctx: Context): number | null {
  return ctx.from?.id || null;
}

function buildAnswerKeyboard() {
  return Markup.inlineKeyboard(
    ANSWER_OPTIONS.map((option) => [
      Markup.button.callback(`${option.label} (${option.score})`, `answer:${option.score}`)
    ])
  );
}

export async function sendMainMenu(ctx: Context): Promise<void> {
  await ctx.reply(
    "Пожалуйста, ответьте на вопросы о самочувствии ваших глаз при чтении и работе вблизи.",
    Markup.keyboard([[START_TEST_BUTTON]]).resize()
  );
}

export async function sendRetakeMenu(ctx: Context): Promise<void> {
  await ctx.reply(
    "Если хотите пройти тест заново, нажмите кнопку ниже.",
    Markup.keyboard([[RETAKE_TEST_BUTTON]]).resize()
  );
}

async function askQuestion(ctx: Context, questionIndex: number): Promise<void> {
  const questionText = TEST_QUESTIONS[questionIndex];
  await ctx.reply(`Вопрос ${questionIndex + 1}/${TEST_QUESTIONS.length}\n\n${questionText}`, buildAnswerKeyboard());
}

export async function startNewTest(ctx: Context): Promise<void> {
  const telegramId = getTelegramId(ctx);
  if (!telegramId) {
    return;
  }

  updateSession(telegramId, {
    state: UserState.IN_TEST,
    currentQuestion: 0,
    answers: []
  });

  await ctx.reply("Начинаем тест.", Markup.removeKeyboard());
  await askQuestion(ctx, 0);
}

export async function continueExistingTest(ctx: Context): Promise<void> {
  const telegramId = getTelegramId(ctx);
  if (!telegramId) {
    return;
  }

  const session = getOrCreateSession(telegramId);
  if (session.state !== UserState.IN_TEST) {
    await startNewTest(ctx);
    return;
  }

  if (session.currentQuestion >= TEST_QUESTIONS.length) {
    resetTestProgress(telegramId);
    await sendMainMenu(ctx);
    return;
  }

  await askQuestion(ctx, session.currentQuestion);
}

export async function handleAnswerCallback(ctx: Context, scoreRaw: string): Promise<void> {
  const telegramId = getTelegramId(ctx);
  if (!telegramId) {
    return;
  }

  const score = Number(scoreRaw);
  if (!Number.isInteger(score) || score < 0 || score > 4) {
    await ctx.answerCbQuery("Некорректный вариант ответа");
    return;
  }

  const session = getOrCreateSession(telegramId);
  if (session.state !== UserState.IN_TEST) {
    await ctx.answerCbQuery("Тест не запущен");
    return;
  }

  const nextAnswers = [...session.answers, score];
  const nextQuestion = session.currentQuestion + 1;

  if (nextAnswers.length < TEST_QUESTIONS.length) {
    updateSession(telegramId, {
      answers: nextAnswers,
      currentQuestion: nextQuestion,
      state: UserState.IN_TEST
    });
    await ctx.answerCbQuery("Ответ принят");
    await askQuestion(ctx, nextQuestion);
    return;
  }

  const total = nextAnswers.reduce((sum, value) => sum + value, 0);
  const profile = getUserProfile(telegramId);
  if (!profile) {
    await ctx.answerCbQuery("Профиль не найден. Нажмите /start");
    return;
  }

  saveTestResult({
    telegramId,
    score: total,
    answers: nextAnswers,
    completedAt: new Date().toISOString()
  });

  resetTestProgress(telegramId, UserState.READY_FOR_TEST);

  await ctx.answerCbQuery("Ответ принят");
  await ctx.reply(`Спасибо за прохождение теста! Вы набрали ${total} баллов.`);
  await sendRetakeMenu(ctx);

  const report = buildDoctorsGroupMessage({
    fullName: profile.fullName,
    birthDate: profile.birthDate,
    username: profile.username,
    phone: profile.phone,
    telegramId,
    score: total,
    answers: nextAnswers
  });

  try {
    await ctx.telegram.sendMessage(config.doctorsGroupId, report);
  } catch (error) {
    console.error("Failed to send report to doctors group:", error);
    await ctx.reply("Результат сохранен, но не удалось отправить его в группу врачей.");
  }
}
