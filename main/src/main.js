import { Telegraf, Markup, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import { downloadFile, transformAudio } from "./functions.js";
import config from "config";
import fs from "fs";

import {INITIAL_SESSION} from "./variables.js"
import { setBotCommands,registerBotCommands } from "./botCommands.js";
import { showMenu, processVoiceMessage} from "./botFunction.js";
import { registerBotActions } from "./botActions.js";


const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());
setBotCommands(bot);

process.setMaxListeners(0);

registerBotCommands(bot)
registerBotActions(bot)


bot.on(message("text"), async (ctx) => {
    ctx.session ??= {...INITIAL_SESSION}
    if (ctx.session.settingPith || ctx.session.settingMangioCrepeHop || ctx.session.settingFeatureRatio || ctx.session.settingProtectVoiceless) {
      const value = parseFloat(ctx.message.text);
      let settingName, minValue, maxValue;
  
      if (ctx.session.settingPith) {
        settingName = "Pith";
        minValue = -14;
        maxValue = 14;
      } else if (ctx.session.settingMangioCrepeHop) {
        settingName = "Mangio-Crepe Hop";
        minValue = 64;
        maxValue = 250;
      } else if (ctx.session.settingFeatureRatio) {
        settingName = "Feature Ratio";
        minValue = 0;
        maxValue = 1;
      } else if (ctx.session.settingProtectVoiceless) {
        settingName = "Protect Voiceless";
        minValue = 0;
        maxValue = 0.5;
      }
  
      if (value >= minValue && value <= maxValue) {
        ctx.session[settingName.toLowerCase().replace(/ /g, "_")] = value;

        ctx.session.settingPith = false;
        ctx.session.settingMangioCrepeHop = false;
        ctx.session.settingFeatureRatio = false;
        ctx.session.settingProtectVoiceless = false;

        await ctx.reply(`${settingName} установлен на ${value}`);
      } else {
        await ctx.reply(`Пожалуйста, введите корректное значение ${settingName} от ${minValue} до ${maxValue}`);
      }
    } else {
      await showMenu(ctx)
    }
    });

    bot.on("voice", (ctx) => {
      // добавляем голосовое сообщение в очередь
      ctx.state.voiceMessagesQueue = ctx.state.voiceMessagesQueue || [];
      ctx.state.voiceMessagesQueue.push(ctx);
    
      // если обработчик сообщений уже работает, не запускаем еще один
      if (ctx.state.processingVoiceMessages) return;
    
      // обработка голосовых сообщений в очереди
      (async () => {
        ctx.state.processingVoiceMessages = true;
    
        while (ctx.state.voiceMessagesQueue.length > 0) {
          const nextCtx = ctx.state.voiceMessagesQueue.shift();
          await processVoiceMessage(nextCtx);
        }
    
        ctx.state.processingVoiceMessages = false;
      })();
    });
    

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));