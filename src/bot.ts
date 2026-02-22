import { Context, Telegraf } from "telegraf";
import http from "node:http";
import { config } from "./config";
import {
  handleContactInput,
  handlePhoneDecisionCallback,
  handleProfileSetupCallback,
  handleRestartDecisionCallback,
  handleStartCommand,
  handleTextInput
} from "./controllers/startController";
import { handleAnswerCallback } from "./controllers/testController";
import "./models/database";

const bot = new Telegraf<Context>(config.botToken);

bot.start(async (ctx) => {
  await handleStartCommand(ctx);
});

bot.on("text", async (ctx) => {
  await handleTextInput(ctx);
});

bot.on("contact", async (ctx) => {
  await handleContactInput(ctx);
});

bot.on("callback_query", async (ctx) => {
  if (!("data" in ctx.callbackQuery)) {
    return;
  }

  const data = ctx.callbackQuery.data;

  if (data.startsWith("name:")) {
    await handleProfileSetupCallback(ctx, data.replace("name:", ""));
    return;
  }

  if (data.startsWith("restart:")) {
    await handleRestartDecisionCallback(ctx, data.replace("restart:", ""));
    return;
  }

  if (data.startsWith("answer:")) {
    await handleAnswerCallback(ctx, data.replace("answer:", ""));
    return;
  }

  if (data.startsWith("phone:")) {
    await handlePhoneDecisionCallback(ctx, data.replace("phone:", ""));
    return;
  }

  await ctx.answerCbQuery("Неизвестная команда");
});

bot.catch((error) => {
  console.error("Bot error:", error);
});

bot
  .launch()
  .then(() => {
    console.log("Bot launched successfully");
  })
  .catch((error) => {
    console.error("Failed to launch bot:", error);
    process.exit(1);
  });

const port = Number(process.env.PORT || 3000);
http
  .createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OK");
  })
  .listen(port, () => {
    console.log(`Health server listening on port ${port}`);
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
