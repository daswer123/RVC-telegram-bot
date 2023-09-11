import { Telegraf, Markup, session } from "telegraf";
import { message } from "telegraf/filters";
import { downloadFile, handleDenoiseAudio, mergeAudioFilesToMp3 } from "./functions.js";
import config from "config";
import fs from "fs";
import path, { sep } from "path";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

import { INITIAL_SESSION } from "./variables.js"
import { setBotCommands, registerBotCommands } from "./botCommands.js";
import { processAudioMessage, is_youtube_url, printCurrentTime, processVideo, processAiCover, checkForBan, createSessionFolder } from "./botFunction.js";
import { registerBotActions } from "./botActions.js";

import { handlePredlog, handleYoutubeCover, textHandler, handleTestVoices, handleMIddleware } from "./handlers.js";
import { sendMessageToAllUsers } from "./admin/botFunctions.js";
import { adminHandler } from "./admin/handler.js";
import { effectHanlder } from "./effects/handler.js";
import { createModelHanlder, handleCreateModelVoice } from "./createModel/handler.js";


import { showMenu } from "./menus/mainMenu.js";
import { handlePresetSave } from "./presets/handler.js";
import { handleSettings } from "./settings/handler.js";
import { clearOperationsDatabase, getSessionFromDatabase, getUserFromDatabase, saveSessionToDatabase, saveUserToDatabase } from "./server/db.js";
import { denoiseHanlder, separate4ItemsHanlder, separate6ItemsHanlder, separateV1Hanlder, separateV2Hanlder, separateV3Hanlder } from "./separate/handler.js";
import { separateAudioBot, separateAudioBot6Items, separateAudioBotv2 } from "./separate/botFunctios.js";

// Указываем путь к ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const bot = new Telegraf(config.get("TELEGRAM_TOKEN"), { handlerTimeout: 900_000 });
bot.use(session());

setBotCommands(bot);

process.setMaxListeners(0);

clearOperationsDatabase()


bot.use(async (ctx, next) => {
  // Попытка получить сессию из базы данных
  try {
    handleMIddleware(ctx, next)
  } catch (err) {
    console.log(err)
  }
});
registerBotActions(bot)
registerBotCommands(bot)

bot.use(async (ctx, next) => {
  // Попытка получить сессию из базы данных
  try {
    // Проверка наличия локальной сессии
    if (!ctx.session || Object.keys(ctx.session).length === 0) {
      // Если локальной сессии нет, попытка получить сессию из базы данных
      const session = await getSessionFromDatabase(ctx.from.id);

      if (session) {
        // Если есть сессия в базе данных, используем её
        ctx.session = session;
        console.log("Загрузка сессия")
      }
      else {
        // Если сессии нигде нет, создаем новую
        ctx.session = { ...INITIAL_SESSION };
        console.log("Создана новая сессия")
      }
    }

    if (ctx.session.loadConfig && Object.keys(ctx.session.loadConfig).length > 0) {
      ctx.session = { ...ctx.session.loadConfig };

      // очистка объекта loadConfig после присвоения сессии
      ctx.session.loadConfig = {};
      await saveSessionToDatabase(ctx.from.id, ctx.session);
    }

    // Проверка наличия пользователя в базе данных
    if (!ctx.session.inDatabase) {
      const user = await getUserFromDatabase(ctx.from.id);
      if (!user) {
        // Если пользователя нет в базе данных, добавляем его и присваиваем статус 'default'
        await saveUserToDatabase(ctx.from.id, ctx.from.username, "default");
      }
      // Помечаем, что пользователь теперь в базе данных
      ctx.session.inDatabase = true;
    }

    // Если количество ключей в локальной сессии и инициализированной сессии отличается
    // или если какое-либо значение в сессии `undefined`
    for (let key in INITIAL_SESSION) {
      if (!(key in ctx.session) || ctx.session[key] === undefined) {
        ctx.session[key] = INITIAL_SESSION[key];
      }
    }
    // console.log("Сессия обновлена с новыми ключами");
    await saveSessionToDatabase(ctx.from.id, ctx.session);

    await next(); // Обработка сообщения ботом

    // Сохранение сессии в базу данных после ответа бота
    await saveSessionToDatabase(ctx.from.id, ctx.session);
  } catch (err) {
    console.log(err)
  }
});


bot.command("start", async (ctx) => {
  try {
    const session = await getSessionFromDatabase(ctx.from.id);

    if (session) {
      ctx.session = session;
    } else {
      ctx.session = { ...INITIAL_SESSION };
      // Если пользователь не найден в базе данных, добавляем его
      await saveUserToDatabase(ctx.from.id, ctx.from.username);

    }

    await ctx.reply("Привет! Я бот для изменения голоса. Для начала работы выберите персонажа /characters .\n\nДля просмотра списка команд введите /help")
    await showMenu(ctx);
  } catch (err) {
    console.log(err)
  }
})



bot.on("video", async (ctx) => {
  // if (protectBot(ctx)) return
  if (await checkForBan(ctx)) return
  try {
    const sessionPath = createSessionFolder(ctx)

    await processVideo(ctx, sessionPath)
    await logUserSession(ctx, "video")
  } catch (err) {
    ctx.reply("Произошла ошибка при обработке видео, повторите снова, возможно ваше видео слишком большое, 20мб или больше")
  }
})


bot.on(message("text"), async (ctx) => {
  // if (protectBot(ctx)) return

  if (await checkForBan(ctx)) return
  try {
    // Каждый хендлер должен иметь  Promise.resolve(false) для правильной работы
    const handlersArray = [
      adminHandler(ctx, bot),
      effectHanlder(ctx),
      createModelHanlder(ctx),
      separateV1Hanlder(ctx),
      separateV2Hanlder(ctx),
      separateV3Hanlder(ctx),
      separate4ItemsHanlder(ctx),
      separate6ItemsHanlder(ctx),
      handleSettings(ctx),
      ctx.session.waitForPredlog ? handlePredlog(ctx) : Promise.resolve(false),
      ctx.session.waitForPresetSave ? handlePresetSave(ctx) : Promise.resolve(false),
    ];

    const results = await Promise.all(handlersArray);

    if (results.every(result => result === false)) {
      if (is_youtube_url(ctx.message.text)) {
        handleYoutubeCover(ctx)
        return
      }

      createSessionFolder(ctx);
      textHandler(ctx);
    }

  } catch (err) {
    console.log(err);
    ctx.reply("Произошла ошибка при обработке сообщения, повторите снова");
  }
});

bot.on("voice", async (ctx) => {
  // if (protectBot(ctx)) return
  if (await checkForBan(ctx)) return

  try {
    handleCreateModelVoice(ctx)
    handleTestVoices(ctx)

    processAudioMessage(ctx)

  } catch (err) {
    ctx.reply("Произошла ошибка при обработки сообщения, попробуйте снова")
    console.log(err)
  }
});

bot.on("audio", async (ctx) => {
  // if (protectBot(ctx)) return
  if (await checkForBan(ctx)) return

  const sessionPath = createSessionFolder(ctx)


  try {

    handleCreateModelVoice(ctx)

    if (ctx.session.waitForDenoise) {
      denoiseHanlder(ctx)
      ctx.session.waitForDenoise = false
      return
    }

    if (ctx.session.waitForSeparate) {
      await separateAudioBot(ctx, sessionPath)
      return
    }

    if (ctx.session.waitForSeparatev2) {
      await separateAudioBotv2(ctx)
      return
    }

    if (ctx.session.waitForSeparate6Items) {
      await separateAudioBot6Items(ctx)
      return
    }

    if (ctx.session.waitingForCover) {
      await processAiCover(ctx);
      return
    }
    else if (ctx.session.mergeAudio) {
      ;
      const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
      const username = ctx.from.username; // получаем ник пользователя
      const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
      const sessionPath = `sessions/${uniqueId}/${messageId}`;

      // создаем папку сессии, если она еще не существует
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      let link;

      link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);

      if (!ctx.session.firstFile) {
        ctx.session.firstFile = `${sessionPath}/audio1.mp3`;
        await downloadFile(link, ctx.session.firstFile);
        // Запрашиваем второй файл
        ctx.reply('Пожалуйста, отправьте второй аудиофайл, это должен быть инструментал:');
      } else {
        ctx.session.secondFile = `${sessionPath}/audio2.mp3`;
        await downloadFile(link, ctx.session.secondFile);

        // Смешиваем аудиофайлы и сохраняем результат в файле MP3
        const outputFile = `${sessionPath}/merged.mp3`;
        ctx.reply("Склеиваем вокал и инструментал...")
        await mergeAudioFilesToMp3(ctx.session.firstFile, ctx.session.secondFile, outputFile, ctx);

        // Отправляем смешанный аудиофайл пользователю
        await ctx.replyWithAudio({ source: fs.createReadStream(outputFile) });
        printCurrentTime()

        // Сбрасываем состояние сессии
        ctx.session.firstFile = null;
        ctx.session.secondFile = null;
      }

    }
    else {
      await processAudioMessage(ctx, true);
    }
  } catch (err) {
    ctx.reply("Произошла ошибка при обработкой аудио")
  }
});

// hideConsole();
bot.launch();

// Restart msg
sendMessageToAllUsers("Бот был перезапущен, все запросы в очереди сброшенны\nВведите /start для начала работы", bot)
// sendMessageToAllUsers("Бот был обновлен, все подробности в информационном канале https://t.me/mister_parodist_info", bot)
// sendMessageToAllUsers("Бот временно не работает, тех.работы", bot)

const sessionPath = `sessions`;
// создаем папку сессии, если она еще не существует
if (!fs.existsSync(sessionPath)) {
  fs.mkdirSync(sessionPath, { recursive: true });
}


process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));