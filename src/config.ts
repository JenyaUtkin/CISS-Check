import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

export const config = {
  botToken: getEnv("BOT_TOKEN"),
  doctorsGroupId: Number(getEnv("DOCTORS_GROUP_ID")),
  dbPath: process.env.DB_PATH || "./data/bot.db"
};

if (Number.isNaN(config.doctorsGroupId)) {
  throw new Error("DOCTORS_GROUP_ID must be a valid number");
}
