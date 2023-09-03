import { Telegraf, Markup, session } from "telegraf";
import { message } from "telegraf/filters";
import { downloadFile, mergeAudioFilesToMp3 } from "./functions.js";
import config from "config";
import fs from "fs";
import path from "path";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

import { INITIAL_SESSION } from "./variables.js"
import { setBotCommands, registerBotCommands } from "./botCommands.js";
import { processAudioMessage, is_youtube_url, separateAudioBot, printCurrentTime, processVideo, processAiCover, checkForBan, createSessionFolder } from "./botFunction.js";
import { registerBotActions } from "./botActions.js";

import { handlePredlog, handlePresetSave, handleYoutubeCover, handleSettings, textHandler, separateHanlder } from "./handlers.js";
import { sendMessageToAllUsers } from "./admin/botFunctions.js";
import { adminHandler } from "./admin/handler.js";
import { effectHanlder } from "./effects/handler.js";
import { createModelHanlder } from "./createModel/handler.js";


import { showMenu } from "./menus/mainMenu.js";

// Указываем путь к ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const bot = new Telegraf(config.get("TELEGRAM_TOKEN"), { handlerTimeout: 600_000 });
bot.use(session());

setBotCommands(bot);

process.setMaxListeners(0);

bot.use((ctx, next) => {
  if (ctx.session) {
    //
  } else {
    ctx.session = { ...INITIAL_SESSION };
  }

  try{
  if (ctx.session.loadConfig && Object.keys(ctx.session.loadConfig).length > 0) {
    
    ctx.session = {...ctx.session.loadConfig};
    
    // очистка объекта loadConfig после присвоения сессии
    ctx.session.loadConfig = {};
  } 
}catch(err){
  console.log("err")
}

  next()
});

registerBotActions(bot)
registerBotCommands(bot)

bot.command("start", async (ctx) => {
  try {
    ctx.session = INITIAL_SESSION;

    await ctx.reply("Привет! Я бот для изменения голоса. Для начала работы выберите персонажа /characters .\n\nДля просмотра списка команд введите /help")
    await showMenu(ctx);
  } catch (err) {
    console.log(err)
  }
})



bot.on("video", async (ctx) => {
  // if (protectBot(ctx)) return
  if(await checkForBan(ctx)) return
  try {


    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
    const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
    const sessionPath = `sessions/${uniqueId}/${messageId}`;

    // Создаем папку для пользователя, если она еще не существует
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }
    await processVideo(ctx, sessionPath)
    await logUserSession(ctx,"video")
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
      adminHandler(ctx),
      effectHanlder(ctx),
      createModelHanlder(ctx),
      separateHanlder(ctx),
      handleSettings(ctx),
      ctx.session.waitForPredlog ? handlePredlog(ctx) : Promise.resolve(false),
      ctx.session.waitForPresetSave ? handlePresetSave(ctx) : Promise.resolve(false),
      is_youtube_url(ctx.message.text) ? handleYoutubeCover(ctx) : Promise.resolve(false),
    ];

    const results = await Promise.all(handlersArray);

    if (results.every(result => result === false)) {
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
  if(await checkForBan(ctx)) return

  try {

    if (ctx.session.waitForVoice) {
      const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
      const folderName = ctx.session.voiceModelName 
      let voicePath = `train_voice/${uniqueId}/${folderName}`;

      // создаем папку сессии, если она еще не существует
      if (!fs.existsSync(voicePath)) {
        fs.mkdirSync(voicePath, { recursive: true });
      }

      const date = new Date();
      const timestamp = date.toISOString().replace(/[:.]/g, '-');

      const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);

      await downloadFile(link, `${voicePath}/${timestamp}-audio.mp3`);
      ctx.reply("Ваш образец был добавлен в часть вашего набора данных", Markup.inlineKeyboard([
        [
          Markup.button.callback('Добавить ещё', 'create_voice_add_sample'),
          Markup.button.callback('Получить текст', 'create_voice_random_text')
        ],
        [
          Markup.button.callback('Меню', 'show_create_voice_menu')
        ]
      ]))
      ctx.session.waitForVoice = false;
      return
    }

    if (ctx.session.testVoice) {
      for (let i = 0; i < 12; i++) {
        ctx.session.pith = i;
        await ctx.reply("Текущая высота тона: " + i)
        await processAudioMessage(ctx)
        printCurrentTime()
      }
      ctx.session.testVoice = false
    }

    // добавляем голосовое сообщение в очередь
    ctx.state.voiceMessagesQueue = ctx.state.voiceMessagesQueue || [];
    ctx.state.voiceMessagesQueue.push(ctx);

    // если обработчик сообщений уже работает, не запускаем еще один
    if (ctx.state.processingVoiceMessages) {
      return
    };

    // обработка голосовых сообщений в очереди
    (async () => {
      ctx.state.processingVoiceMessages = true;

      while (ctx.state.voiceMessagesQueue.length > 0) {
        const nextCtx = ctx.state.voiceMessagesQueue.shift();
        await processAudioMessage(nextCtx);
        printCurrentTime()
      }

      ctx.state.processingVoiceMessages = false;
    })();
  } catch (err) {
    ctx.reply("Произошла ошибка при обработки сообщения, попробуйте снова")
    console.log(err)
  }
});

bot.on("audio", async (ctx) => {
  // if (protectBot(ctx)) return
  if(await checkForBan(ctx)) return

  const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
  const username = ctx.from.username; // получаем ник пользователя
  const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
  const sessionPath = `sessions/${uniqueId}/${messageId}`;

  try {

    if (ctx.session.waitForVoice) {
      const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
      const folderName = ctx.session.voiceModelName 
      let voicePath = `train_voice/${uniqueId}/${folderName}`;

      // создаем папку сессии, если она еще не существует
      if (!fs.existsSync(voicePath)) {
        fs.mkdirSync(voicePath, { recursive: true });
      }

      const date = new Date();
      const timestamp = date.toISOString().replace(/[:.]/g, '-');

      const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);

      await downloadFile(link, `${voicePath}/${timestamp}-audio.mp3`);
      ctx.reply("Ваш образец был добавлен в часть вашего набора данных", Markup.inlineKeyboard([
        [
          Markup.button.callback('Добавить ещё', 'create_voice_add_sample'),
          Markup.button.callback('Получить текст', 'create_voice_random_text')
        ],
        [
          Markup.button.callback('Меню', 'show_create_voice_menu')
        ]
      ]))
      ctx.session.waitForVoice = false;
      return
    }

    if (ctx.session.waitForSeparate) {

      // добавляем аудио сообщение в очередь
      ctx.state.audioMessagesQueue = ctx.state.audioMessagesQueue || [];
      ctx.state.audioMessagesQueue.push(ctx);

      // если обработчик сообщений уже работает, не запускаем еще один
      if (ctx.state.processingAudioMessages) {
        await ctx.reply("Разделение аудио уже запущено у другово человека, подождите")
        return
      };

      // обработка аудио сообщений в очереди
      (async () => {
        ctx.state.processingAudioMessages = true;

        while (ctx.state.audioMessagesQueue.length > 0) {
          const nextCtx = ctx.state.audioMessagesQueue.shift();
          await ctx.reply("Начало обработки")
          await separateAudioBot(nextCtx, sessionPath);
          ctx.session.waitForSeparate = false;
        }

        ctx.state.processingAudioMessages = false;
      })();

      return
    }

    if (ctx.session.waitingForCover) {

      // добавляем голосовое сообщение в очередь
      ctx.state.voiceMessagesQueue = ctx.state.voiceMessagesQueue || [];
      ctx.state.voiceMessagesQueue.push(ctx);

      // если обработчик сообщений уже работает, не запускаем еще один
      if (ctx.state.processingVoiceMessages) {
        await ctx.reply("Создание кавера уже запущено у другово человека, подождите")
        return
      };

      // обработка голосовых сообщений в очереди
      (async () => {
        ctx.state.processingVoiceMessages = true;

        while (ctx.state.voiceMessagesQueue.length > 0) {
          const nextCtx = ctx.state.voiceMessagesQueue.shift();
          await processAiCover(nextCtx);
          ctx.session.waitingForCover = false;
        }

        ctx.state.processingVoiceMessages = false;
      })();

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

      try {
        // создаем текстовый файл с именем пользователя
        const filename = `${username}.txt`;
        const filepath = path.join(sessionPath, filename);
        fs.writeFileSync(filepath, `User: ${username}\nUnique ID: ${uniqueId}\nMessage ID: ${messageId}`);
      } catch (err) {
        console.log(err)
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
          console.log("Startttt")
          await processAudioMessage(nextCtx, true);
        }

        ctx.state.processingVoiceMessages = false;
      })();
    }
  } catch (err) {
    ctx.reply("Произошла ошибка при обработкой аудио")
  }
});

// hideConsole();
bot.launch();

// Restart msg
sendMessageToAllUsers("Бот был перезапущен, все настройки сброшенны\nВведите /start для начала работы", bot)
// sendMessageToAllUsers("Бот был обновлен, все подробности в информационном канале https://t.me/mister_parodist_info", bot)
// sendMessageToAllUsers("Бот временно не работает, тех.работы", bot)

const sessionPath = `sessions`;
// создаем папку сессии, если она еще не существует
if (!fs.existsSync(sessionPath)) {
  fs.mkdirSync(sessionPath, { recursive: true });
}


process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));