import { Telegraf, Markup, session } from "telegraf";
import { message } from "telegraf/filters";
import { downloadFile, mergeAudioFilesToMp3, createVoice, updateNumbersInJson, banUser, unbanUser } from "./functions.js";
import config from "config";
import fs from "fs";
import path from "path";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

import { showConsole, hideConsole } from "node-hide-console-window";


import { INITIAL_SESSION } from "./variables.js"
import { setBotCommands, registerBotCommands } from "./botCommands.js";
import { showMenu, processAudioMessage, is_youtube_url, separateAudioBot, sendMessageToAllUsers, printCurrentTime, processVideo, saveSuggestion, processAiCover, Semaphore, protectBot, showCreateMenu, sendMessageToUser, checkForBan, noteOctaveToFrequency } from "./botFunction.js";
import { registerBotActions } from "./botActions.js";
import { downloadFromYoutube } from "./functions.js";

import { handlePredlog, handlePresetSave, handleYoutubeCover, handleSettings, textHandler } from "./handlers.js";

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
  if(await checkForBan(ctx)) return

  try {

    if(ctx.session.waitForBan){
      const uniqueId = ctx.message.text; // получаем уникальный идентификатор пользователя
      banUser(uniqueId)
      ctx.reply("Пользователь успешно забанен")
      ctx.session.waitForBan = false
      return 
    }

    if(ctx.session.waitForUnBan){
      const uniqueId = ctx.message.text; // получаем уникальный идентификатор пользователя
      unbanUser(uniqueId)
      ctx.reply("Пользователь успешно забанен")
      ctx.session.waitForUnBan = false
      return 
    }


    if(ctx.session.waitForEchoDelay){
      const input = ctx.message.text; // входные данные пользователя
      ctx.session.echoDelay = Math.max(0.05, Math.min(3, parseFloat(input))); // проверяем и присваиваем входные данные к echoDelay
      ctx.session.waitForEchoDelay = false;
      ctx.reply(`Значение echoDelay было успешно установлено как ${ctx.session.echoDelay}`, Markup.inlineKeyboard([
          Markup.button.callback('Назад', 'effects_settings')
      ]));
      return;
  }
  
  if(ctx.session.waitForEchoPower){
      const input = ctx.message.text; // входные данные пользователя
      ctx.session.echoPower = Math.max(0.05, Math.min(3, parseFloat(input))); // проверяем и присваиваем входные данные к echoPower
      ctx.session.waitForEchoPower = false;
      ctx.reply(`Значение echoPower было успешно установлено как ${ctx.session.echoPower}`, Markup.inlineKeyboard([
          Markup.button.callback('Назад', 'effects_settings')
      ]));
      return;
  }
  
  if(ctx.session.waitForReverb){
      const input = ctx.message.text; // входные данные пользователя
      ctx.session.reverbPower = Math.max(0.00001, Math.min(1, parseFloat(input))); // проверяем и присваиваем входные данные к reverbPower
      ctx.session.waitForReverb = false;
      ctx.reply(`Значение reverbPower было успешно установлено как ${ctx.session.reverbPower}`, Markup.inlineKeyboard([
          Markup.button.callback('Назад', 'effects_settings')
      ]));
      return;
  }
  
  if(ctx.session.waitForAutotuneAttack){
      const input = ctx.message.text; // входные данные пользователя
      ctx.session.autotune_attack = Math.max(0.05, Math.min(1, parseFloat(input))); // проверяем и присваиваем входные данные к autotune_attack
      ctx.session.waitForAutotuneAttack = false;
      ctx.reply(`Значение autotune_attack было успешно установлено как ${ctx.session.autotune_attack}`, Markup.inlineKeyboard([
          Markup.button.callback('Назад', 'effects_settings')
      ]));
      return;
  }
  
  if(ctx.session.waitForAutotuneStr){
      const input = ctx.message.text; // входные данные пользователя
      ctx.session.autotune_strength = Math.max(0.05, Math.min(1, parseFloat(input))); // проверяем и присваиваем входные данные к autotune_strength
      ctx.session.waitForAutotuneStr = false;
      ctx.reply(`Значение autotune_strength было успешно установлено как ${ctx.session.autotune_strength}`, Markup.inlineKeyboard([
          Markup.button.callback('Назад', 'effects_settings')
      ]));
      return;
  }

    if(ctx.session.waitForMinPich){
      const input = ctx.message.text; // ввод пользователя
    
      // Проверяем, ввел ли пользователь частоту в Гц (число от 1 до 16000)
      const hzValue = parseFloat(input);
      if (hzValue >= 1 && hzValue <= 16000) {
        // прямо записываем значение в Гц
        ctx.session.minPich = hzValue;
        ctx.reply(`Значение в ${ctx.session.minPich} было сохраннено`)
      } else {
        // Проверяем, ввел ли пользователь пару [нота][октава]
        const noteMatch = input.match(/^([A-G]b?#?)(-?\d+)$/i);
        if (noteMatch) {
          const note = noteMatch[1];
          const octave = parseInt(noteMatch[2], 10);
          // конвертируем [нота][октава] в Гц и записываем
          ctx.session.minPich = Math.floor(noteOctaveToFrequency(note, octave));
          ctx.reply(`Значение в ${ctx.session.minPich} было сохраннено`)
        } else {
          ctx.reply("Неверный ввод, вводите на английской раскладке или значения от 1 до 16000")
          // Неверный ввод, можно отправить сообщение об ошибке
        }
      }

      showMenu(ctx)
      ctx.session.waitForMinPich = false
      return
    }

    if(ctx.session.waitForMaxPich){
      const input = ctx.message.text; // ввод пользователя
    
      // Проверяем, ввел ли пользователь частоту в Гц (число от 1 до 16000)
      const hzValue = parseFloat(input);
      if (hzValue >= 1 && hzValue <= 16000) {
        // прямо записываем значение в Гц
        ctx.session.maxPich = hzValue;
        ctx.reply(`Значение в ${ctx.session.maxPich} было сохраннено`)
      } else {
        // Проверяем, ввел ли пользователь пару [нота][окtава]
        const noteMatch = input.match(/^([A-G]b?#?)(-?\d+)$/i);
        if (noteMatch) {
          const note = noteMatch[1];
          const octave = parseInt(noteMatch[2], 10);
          // конвертируем [нота][окtава] в Гц и записываем
          ctx.session.maxPich = Math.floor(noteOctaveToFrequency(note, octave));
          ctx.reply(`Значение в ${ctx.session.maxPich} было сохраннено`)
        } else {
          ctx.reply("Неверный ввод, вводите на английской раскладке или значения от 1 до 16000")
          // Неверный ввод, можно отправить сообщение об ошибке
        }
      }

      showMenu(ctx)
      ctx.session.waitForMaxPich = false
      return
    }

    if(ctx.session.waitForControlPower){
      ctx.session.waitForControlPower = false
      const [transform,silero,separate] = ctx.message.text.split(",")

      updateNumbersInJson(transform,silero,separate)
      ctx.reply("Данные успешно обновленны")
      return
    }

    if(ctx.session.waitForAnonceAll){
      ctx.session.waitForAnonceAll = false
      sendMessageToAllUsers(ctx.message.text, bot)
      return
    }

    if(ctx.session.waitForAnonceCurrent){
      ctx.session.waitForAnonceCurrent = false

      const [id,message] = ctx.message.text.split(",")
      sendMessageToUser(id,message, bot)
      return
    }

    

    if(ctx.session.waitForModelName){
      ctx.session.voiceModelName = ctx.message.text
      await ctx.reply("Ваша модель была названа: "+ctx.session.voiceModelName)
      await ctx.reply("Теперь вам нужно ввести краткое описание модели")

      ctx.session.waitForModelName = false
      ctx.session.waitForModelDesc = true
      return
    }

    if(ctx.session.waitForModelDesc){
      ctx.session.voiceModelDesc = ctx.message.text
      await ctx.reply("Описание для вашей модели было записанно")
      await ctx.reply("Введите пол модели, обязательно вводите по шаблону\nmale\nfemale\nchild")

      ctx.session.waitForModelDesc = false
      ctx.session.waitForModelGender = true
      return
    }

    if(ctx.session.waitForModelGender){
      ctx.session.voiceModelGender = ctx.message.text
      await ctx.reply("Пол для вашей модели был записан")
  
      ctx.session.waitForModelGender = false
      await ctx.reply("Инициализация модели прошла успешно, вы можете добавлять образцы голоса", Markup.inlineKeyboard([
        Markup.button.callback('Меню', 'show_create_voice_menu')
      ]))
      return
    }

    if (ctx.session.waitForSeparate) {
      if (!is_youtube_url(ctx.message.text)) {
        ctx.reply("Неправильная ссылка на ютуб, введите команду /separate и попробуйте еще раз")
        ctx.session.waitForSeparate = false
        return
      }
      const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
      const username = ctx.from.username; // получаем ник пользователя
      const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
      const sessionPath = `sessions/${uniqueId}/${messageId}`;

      await downloadFromYoutube(ctx.message.text, sessionPath);

      await separateAudioBot(ctx, sessionPath, true)
      ctx.session.waitForSeparate = false
      return

    }

    // Обработка сохранения пресета
    if (ctx.session.waitForPredlog && handlePredlog(ctx)) {
      return;
    }

    // Обработка сохранения пресета
    if (ctx.session.waitForPresetSave && handlePresetSave(ctx)) {
      return;
    }

    // Обработка ютуб ссылки для кавера
    if (is_youtube_url(ctx.message.text) && handleYoutubeCover(ctx)) {
      return;
    }

    // Обработка настроек
    if (await handleSettings(ctx)) {
      return;
    }
    else {
      textHandler(ctx)
    }
  } catch (err) {
    console.log(err)
    ctx.reply("Произошла ошибка при обработке сообщения, повторите снова")
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
        ctx.reply("Склеиваем вокал и интрументал...")
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