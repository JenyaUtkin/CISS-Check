import { Context, Markup } from "telegraf";
import { getOrCreateSession, resetTestProgress, updateSession } from "../models/sessionModel";
import { deleteUserProfile, getUserProfile, upsertUserProfile } from "../models/userModel";
import { UserState } from "../types";
import { RETAKE_TEST_BUTTON, START_TEST_BUTTON } from "../utils/constants";
import { isValidBirthDate } from "../utils/validation";
import { continueExistingTest, sendMainMenu, startNewTest } from "./testController";

function getTelegramId(ctx: Context): number | null {
  return ctx.from?.id || null;
}

function fullNameFromTelegram(ctx: Context): string {
  const firstName = ctx.from?.first_name?.trim() || "";
  const lastName = ctx.from?.last_name?.trim() || "";
  return `${lastName} ${firstName}`.trim();
}

async function askNamePermission(ctx: Context): Promise<void> {
  await ctx.reply("Заполним профиль перед началом теста.", Markup.removeKeyboard());
  await ctx.reply(
    "Разрешаете использовать имя из вашего Telegram-профиля?",
    Markup.inlineKeyboard([
      [Markup.button.callback("Да, использовать имя из профиля", "name:tg")],
      [Markup.button.callback("Нет, ввести вручную", "name:manual")]
    ])
  );
}

async function askBirthDate(ctx: Context): Promise<void> {
  await ctx.reply("Введите вашу дату рождения в формате ДД.ММ.ГГГГ (например, 01.01.1990):");
}

async function askPhoneConsent(ctx: Context): Promise<void> {
  await ctx.reply(
    "Хотите указать номер телефона для анкеты?",
    Markup.inlineKeyboard([
      [Markup.button.callback("Да, указать телефон", "phone:yes")],
      [Markup.button.callback("Нет, продолжить без телефона", "phone:no")]
    ])
  );
}

async function askPhoneContact(ctx: Context): Promise<void> {
  await ctx.reply(
    "Нажмите кнопку ниже, чтобы отправить номер телефона.",
    Markup.keyboard([Markup.button.contactRequest("📱 Отправить телефон")]).resize()
  );
}

export async function handleStartCommand(ctx: Context): Promise<void> {
  const telegramId = getTelegramId(ctx);
  if (!telegramId) {
    return;
  }

  const profile = getUserProfile(telegramId);
  const session = getOrCreateSession(telegramId);

  if (!profile) {
    updateSession(telegramId, {
      state: UserState.AWAITING_NAME_PERMISSION,
      currentQuestion: 0,
      answers: [],
      tempFullName: null
    });
    await askNamePermission(ctx);
    return;
  }

  if (session.state === UserState.IN_TEST && session.answers.length > 0) {
    updateSession(telegramId, { state: UserState.AWAITING_RESTART_DECISION });
    await ctx.reply(
      "Вы прервали прошлый тест. Рекомендуем начать заново. Что сделать?",
      Markup.inlineKeyboard([
        [Markup.button.callback("Начать заново", "restart:yes")],
        [Markup.button.callback("Продолжить текущий", "restart:continue")]
      ])
    );
    return;
  }

  resetTestProgress(telegramId, UserState.READY_FOR_TEST);
  await sendMainMenu(ctx);
}

export async function handleProfileSetupCallback(ctx: Context, action: string): Promise<void> {
  const telegramId = getTelegramId(ctx);
  if (!telegramId) {
    return;
  }

  if (action === "tg") {
    const name = fullNameFromTelegram(ctx);
    if (!name) {
      updateSession(telegramId, { state: UserState.AWAITING_MANUAL_NAME, tempFullName: null });
      await ctx.answerCbQuery("Имя не найдено в Telegram-профиле");
      await ctx.reply("Введите ваше ФИО полностью (например, Иванов Иван Иванович):");
      return;
    }

    updateSession(telegramId, {
      state: UserState.AWAITING_BIRTH_DATE,
      tempFullName: name
    });
    await ctx.answerCbQuery("Имя взято из профиля");
    await askBirthDate(ctx);
    return;
  }

  if (action === "manual") {
    updateSession(telegramId, {
      state: UserState.AWAITING_MANUAL_NAME,
      tempFullName: null
    });
    await ctx.answerCbQuery();
    await ctx.reply("Введите ваше ФИО полностью (например, Иванов Иван Иванович):");
  }
}

export async function handleRestartDecisionCallback(ctx: Context, action: string): Promise<void> {
  const telegramId = getTelegramId(ctx);
  if (!telegramId) {
    return;
  }

  if (action === "yes") {
    await ctx.answerCbQuery("Начинаем заново");
    await startNewTest(ctx);
    return;
  }

  if (action === "continue") {
    updateSession(telegramId, { state: UserState.IN_TEST });
    await ctx.answerCbQuery("Продолжаем текущий тест");
    await continueExistingTest(ctx);
  }
}

export async function handlePhoneDecisionCallback(ctx: Context, action: string): Promise<void> {
  const telegramId = getTelegramId(ctx);
  if (!telegramId) {
    return;
  }

  const profile = getUserProfile(telegramId);
  if (!profile) {
    await ctx.answerCbQuery("Сначала заполните профиль через /start");
    return;
  }

  if (action === "yes") {
    updateSession(telegramId, { state: UserState.AWAITING_PHONE_CONTACT });
    await ctx.answerCbQuery();
    await askPhoneContact(ctx);
    return;
  }

  if (action === "no") {
    updateSession(telegramId, { state: UserState.READY_FOR_TEST });
    await ctx.answerCbQuery();
    await ctx.reply("Профиль успешно сохранен.", Markup.removeKeyboard());
    await sendMainMenu(ctx);
  }
}

export async function handleContactInput(ctx: Context): Promise<void> {
  const telegramId = getTelegramId(ctx);
  if (!telegramId || !ctx.message || !("contact" in ctx.message)) {
    return;
  }

  const session = getOrCreateSession(telegramId);
  if (session.state !== UserState.AWAITING_PHONE_CONTACT) {
    return;
  }

  const profile = getUserProfile(telegramId);
  if (!profile) {
    await ctx.reply("Профиль не найден. Нажмите /start");
    return;
  }

  upsertUserProfile({
    telegramId,
    fullName: profile.fullName,
    birthDate: profile.birthDate,
    username: profile.username,
    phone: ctx.message.contact.phone_number
  });

  updateSession(telegramId, { state: UserState.READY_FOR_TEST });
  await ctx.reply("Телефон сохранен.", Markup.removeKeyboard());
  await sendMainMenu(ctx);
}

export async function handleTextInput(ctx: Context): Promise<void> {
  const telegramId = getTelegramId(ctx);
  if (!telegramId || !ctx.message || !("text" in ctx.message)) {
    return;
  }

  const text = ctx.message.text.trim();
  if (!text) {
    return;
  }

  if (text === START_TEST_BUTTON) {
    const profile = getUserProfile(telegramId);
    if (!profile) {
      await ctx.reply("Сначала заполните профиль через команду /start");
      return;
    }

    await startNewTest(ctx);
    return;
  }

  if (text === RETAKE_TEST_BUTTON) {
    deleteUserProfile(telegramId);
    updateSession(telegramId, {
      state: UserState.AWAITING_NAME_PERMISSION,
      currentQuestion: 0,
      answers: [],
      tempFullName: null
    });

    await ctx.reply("Начинаем заново. Заполним ваши данные еще раз.", Markup.removeKeyboard());
    await askNamePermission(ctx);
    return;
  }

  const session = getOrCreateSession(telegramId);
  if (session.state === UserState.AWAITING_MANUAL_NAME) {
    if (text.length < 5) {
      await ctx.reply("Пожалуйста, введите корректное ФИО полностью.");
      return;
    }

    updateSession(telegramId, {
      state: UserState.AWAITING_BIRTH_DATE,
      tempFullName: text
    });
    await askBirthDate(ctx);
    return;
  }

  if (session.state === UserState.AWAITING_BIRTH_DATE) {
    if (!isValidBirthDate(text)) {
      await ctx.reply("Неверный формат даты. Введите дату в формате ДД.ММ.ГГГГ (например, 01.01.1990):");
      return;
    }

    const fullName = session.tempFullName || fullNameFromTelegram(ctx);
    if (!fullName) {
      updateSession(telegramId, { state: UserState.AWAITING_MANUAL_NAME, tempFullName: null });
      await ctx.reply("Не удалось определить ФИО. Введите ваше ФИО полностью:");
      return;
    }

    upsertUserProfile({
      telegramId,
      fullName,
      birthDate: text,
      username: ctx.from?.username || null,
      phone: null
    });
    updateSession(telegramId, {
      state: UserState.AWAITING_PHONE_DECISION,
      tempFullName: null,
      currentQuestion: 0,
      answers: []
    });

    await askPhoneConsent(ctx);
    return;
  }

  if (session.state === UserState.AWAITING_PHONE_CONTACT) {
    await ctx.reply("Чтобы добавить телефон, нажмите кнопку «📱 Отправить телефон».");
    return;
  }

  if (session.state === UserState.AWAITING_PHONE_DECISION) {
    await ctx.reply("Выберите вариант кнопкой: указать телефон или продолжить без него.");
    return;
  }

  if (session.state === UserState.IN_TEST) {
    await ctx.reply("Пожалуйста, отвечайте на вопросы кнопками под сообщением.");
    return;
  }

  await ctx.reply("Используйте кнопку «🔍 Пройти тест» или команду /start");
}
