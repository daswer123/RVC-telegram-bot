import { Markup } from "telegraf";
import config from "config";
import fs from "fs";
import path from "path";
import ffmpeg from 'fluent-ffmpeg';

import { createVoice, logUserSession, slowDownAudioYa } from "./functions.js";
import { processAudioMessage, process_youtube_audio, printCurrentTime, saveSuggestion, is_youtube_url } from "./botFunction.js";
import { generateSpeechYA } from "./yandexTTS.js";

// import { registerAdminBotActions } from "./admin/botActions.js";
// import { registerCreateMenuBotActions } from "./createModel/botActions.js";
// import { showCurrentSettings, showMenu } from "./menus/mainMenu.js";
// import { showSettings } from "./menus/settingsMenu.js";
// import { showAICoverSettings } from "./menus/aicoverMenu.js";
// import { showEffectsSettings } from "./menus/effectsMenu.js";



// Handlers
export const handlePredlog = (ctx) => {
  saveSuggestion(ctx.from.username, ctx.message.text);

  ctx.reply(`Предложение по улучшению было успешно записанно`, Markup.inlineKeyboard([
    Markup.button.callback('Меню', 'menu')
  ]));
  ctx.session.waitForPredlog = false;
  return true;
}

export const handleYoutubeCover = (ctx) => {
  const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
  const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
  const username = ctx.from.username; // получаем ник пользователя
  const sessionPath = `sessions/${uniqueId}/${messageId}`;

  // Если пользователь отправил YouTube URL и ожидается обложка
  const youtube_url = ctx.message.text;

  ctx.reply("Скачивание аудио с YouTube...");
  process_youtube_audio(ctx, sessionPath, youtube_url);

  ctx.session.waitingForCover = false;
  return true;
}




async function createVoiceAndProcess(ctx, uniqueId, messageId, sessionPath) {
  const response = await createVoice(ctx.session.voiceActor, ctx.message.text, messageId);
  await logUserSession(ctx, "tts", ctx.session.voiceActor)

  // Поиск файла с нужным названием
  const sieroPath = path.join(config.get('SIERO_AUDIO_PATH'), String(messageId));
  const files = fs.readdirSync(sieroPath);
  const foundFile = files.find((file) => /\.wav$/.test(file));

  let newFilePath, slowedFilePath;

  if (foundFile) {
    // Обработка и перемещение файла
    const paths = await processAndMoveFile(ctx, sieroPath, foundFile, sessionPath);
    newFilePath = paths.newFilePath;
    slowedFilePath = paths.slowedFilePath;
  }

  return { newFilePath, slowedFilePath };
}

export async function textHandler(ctx) {
  try {
    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
    const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
    const username = ctx.from.username; // получаем ник пользователя
    const sessionPath = `sessions/${uniqueId}/${messageId}`;

    if (!ctx.session.voiceActor.startsWith("yandex_")) {
      const { newFilePath, slowedFilePath } = await createVoiceAndProcess(ctx, uniqueId, messageId, sessionPath);
      writeUsernameFile(sessionPath, username, uniqueId, messageId);
    } else {
      const speaker = ctx.session.voiceActor.split("_")[1];
      await generateSpeechYA(sessionPath, "generated_speach.mp3", ctx.message.text, speaker);
      await slowDownAudioYa(`${sessionPath}/generated_speach.mp3`, ctx.session.voice_speed);
    }

    const slowedFilePath = `${sessionPath}/generated_voice_slowed.wav`

    await ctx.reply("Текст озвучен, преобразование голоса");

    // добавляем голосовое сообщение в очередь
    ctx.state.voiceMessagesQueue = ctx.state.voiceMessagesQueue || [];
    ctx.state.voiceMessagesQueue.push(ctx);

    // если обработчик сообщений уже работает, не запускаем еще один
    if (!ctx.state.processingVoiceMessages) {
      processVoiceMessagesQueue(ctx, slowedFilePath, sessionPath);
    }

    if (ctx.session.mergeAudio || ctx.session.waitingForCover) {
      ctx.session.mergeAudio = false;
      ctx.session.waitingForCover = false;
      await ctx.reply("Отмена операции");
      return
    }

  } catch (err) {
    await ctx.reply("Что-то пошло не так. Попробуйте снова")
    console.log(err)
    return
  }
}

export async function separateHanlder(ctx) {
  try {
    if (ctx.session.waitForSeparate) {
      if (!is_youtube_url(ctx.message.text)) {
        ctx.reply("Неправильная ссылка на ютуб, введите команду /separate и попробуйте еще раз")
        ctx.session.waitForSeparate = false
        return
      }
      const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
      const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
      const sessionPath = `sessions/${uniqueId}/${messageId}`;

      await downloadFromYoutube(ctx.message.text, sessionPath);

      await separateAudioBot(ctx, sessionPath, true)
      ctx.session.waitForSeparate = false
      return

    }

    return Promise.resolve(false)
  } catch (err) { console.log(err) }
}


async function processVoiceMessagesQueue(ctx, slowedFilePath, sessionPath) {
  ctx.state.processingVoiceMessages = true;

  while (ctx.state.voiceMessagesQueue.length > 0) {
    const nextCtx = ctx.state.voiceMessagesQueue.shift();
    await processAudioMessage(nextCtx, false, slowedFilePath, sessionPath);
    printCurrentTime()
  }

  ctx.state.processingVoiceMessages = false;
}



async function processAndMoveFile(ctx, sieroPath, foundFile, sessionPath) {
  // Перемещение файла в папку сессии
  const sourcePath = path.join(sieroPath, foundFile);
  const destinationPath = path.join(sessionPath, foundFile);
  moveFile(sourcePath, destinationPath);

  const newFileName = 'generated_voice.wav';
  const newFilePath = path.join(path.dirname(destinationPath), newFileName);
  fs.renameSync(destinationPath, newFilePath);

  // Замедляем аудиозапись
  const slowedFileName = 'generated_voice_slowed.wav';
  const slowedFilePath = path.join(path.dirname(destinationPath), slowedFileName);
  await slowDownAudio(ctx, newFilePath, slowedFilePath);

  return { newFilePath, slowedFilePath };
}

async function slowDownAudio(ctx, newFilePath, slowedFilePath) {
  await ffmpeg(newFilePath)
    .audioFilters(`atempo=${ctx.session.voice_speed}`)
    .on('error', function (err) {
      console.error(`Error occurred while slowing down the audio: ${err.message}`);
    })
    .on('end', function () {
      // Удаляем исходный файл, если замедленный файл успешно создан
      fs.unlinkSync(newFilePath);
    })
    .save(slowedFilePath);
}

function moveFile(sourcePath, destinationPath) {
  // Проверка существования исходного пути
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source path does not exist: ${sourcePath}`);
    return;
  }

  // Создание папки назначения, если она не существует
  const destinationDir = path.dirname(destinationPath);
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  fs.renameSync(sourcePath, destinationPath);
}

function writeUsernameFile(sessionPath, username, uniqueId, messageId) {
  try {
    // создаем текстовый файл с именем пользователя
    const filename = `${username}.txt`;
    const filepath = path.join(sessionPath, filename);
    fs.writeFileSync(filepath, `User: ${username}\nUnique ID: ${uniqueId}\nMessage ID: ${messageId}`);
  } catch (err) {
    console.log(err)
  }
}
