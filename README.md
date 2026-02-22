# CISS Check Telegram Bot

Telegram-бот на TypeScript для скрининга пациентов по 14 вопросам о самочувствии глаз.

## Возможности

- Регистрация профиля пациента (ФИО + дата рождения)
- Вариант взять имя из Telegram-профиля или ввести вручную
- Валидация даты рождения в формате `ДД.ММ.ГГГГ`
- Опрос из 14 вопросов с оценкой от 0 до 4
- Сохранение состояний пользователя (FSM) и результатов в SQLite
- Отправка итоговой анкеты в Telegram-группу врачей

## Технологии

- Node.js
- TypeScript
- Telegraf
- SQLite (`better-sqlite3`)

## Структура проекта

```text
src/
  controllers/
    startController.ts
    testController.ts
  models/
    database.ts
    sessionModel.ts
    userModel.ts
  types/
    index.ts
  utils/
    constants.ts
    formatters.ts
    validation.ts
  bot.ts
  config.ts
```

## Установка

1. Установите зависимости:

```bash
npm install
```

2. Создайте `.env` на основе примера:

```bash
cp .env.example .env
```

3. Заполните значения в `.env`:

```env
BOT_TOKEN=your_telegram_bot_token_here
DOCTORS_GROUP_ID=-1001234567890
DB_PATH=./data/bot.db
```

## Запуск

Режим разработки:

```bash
npm run dev
```

Сборка и запуск production:

```bash
npm run build
npm run start
```

## Важно для отправки в группу врачей

- Бот должен быть добавлен в группу.
- Боту нужны права на отправку сообщений в группу.
- Значение `DOCTORS_GROUP_ID` должно соответствовать ID этой группы.
