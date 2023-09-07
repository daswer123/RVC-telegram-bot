import { Markup } from "telegraf";
import { downloadFile, downloadFromYoutube, transformAudio, separateAudio, mergeAudioFilesToMp3, splitVideoAndAudio, mergeAudioAndVideo, separateAudioVR, compressMp3, logUserSession, getBannedUsers, improveAudio, autotuneAudio, convertToOgg, phoneCallEffects } from "./functions.js";
import { INITIAL_SESSION } from "./variables.js";
import config from "config";
import fs from "fs";
import path from "path";

export class Semaphore {
  constructor(count) {
    this.count = count;
    this.waiting = [];
  }

  acquire() {
    return new Promise((resolve) => {
      if (this.count > 0) {
        this.count--;
        resolve();
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  release() {
    if (this.waiting.length > 0) {
      const nextInLine = this.waiting.shift();
      nextInLine();
    } else {
      this.count++;
    }
  }
}


export function getRandomMaleVoice(voices) {
  const index = Math.floor(Math.random() * MALE_VOICES.length);
  return MALE_VOICES[index].id;
}

export function getRandomFemaleVoice(voices) {
  const index = Math.floor(Math.random() * FEMALE_VOICES.length);
  return FEMALE_VOICES[index].id;
}


export function createSessionFolder(ctx) {
  const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
  const username = ctx.from.username; // получаем ник пользователя
  const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
  const sessionPath = `sessions/${uniqueId}/${messageId}`;

  // Создаем папку для пользователя, если она еще не существует
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  return sessionPath
}


export async function checkForBan(ctx) {
  const uniqueId = String(ctx.from.id); // получаем уникальный идентификатор пользователя и преобразуем его в строку

  const bannedUsers = await getBannedUsers();

  console.log(uniqueId, bannedUsers, bannedUsers.includes(uniqueId))

  // Проверяем, забанен ли пользователь
  if (bannedUsers.includes(uniqueId)) {
    ctx.reply("Внимание, доступ к боту заблокирован, вы были забаненны")
    return true;
  }

  return false;
}

export function protectBot(ctx) {
  const isStarted = ctx?.session?.isAvalible
  if (!isStarted) {
    ctx.reply("Введите /start для начала работы")
    return true
  }
  return false
}


// Функция для информировании о времени
export function printCurrentTime() {

  const now = new Date();

  let hours = now.getHours();
  if (hours < 10) {
    hours = '0' + hours;
  }

  let minutes = now.getMinutes();
  if (minutes < 10) {
    minutes = '0' + minutes;
  }

  let seconds = now.getSeconds();
  if (seconds < 10) {
    seconds = '0' + seconds;
  }

  const timeString = `${hours}:${minutes}:${seconds}`;

  console.log(timeString);
}

export async function separateAudioBot(ctx, sessionPath, isAudio = false) {
  try {
    console.log("start")
    // Создаем папку сессии, если она еще не существует
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    if (!isAudio) {
      const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
      await downloadFile(link, `${sessionPath}/audio.wav`);
    }

    const fullSessionPath = path.join(config.get("MAIN_PATH"), sessionPath);
    const vocalPath = path.join(fullSessionPath, "vocal.mp3");
    const instrumentalPath = path.join(fullSessionPath, "instrumental.mp3");

    let vocalPathDeEcho, vocalString, backVocal;

    vocalString = "Вокал"

    const prevState = ctx.session.audioProcessPower
    ctx.session.audioProcessPower = "both"

    let processMessage = await ctx.reply("Разделение вокала и фоновой музыки");
    await separateAudio(sessionPath, "audio.wav");

    if (ctx.session.audioProcessPower === "echo" || ctx.session.audioProcessPower === "both") {
      // Убираем эхо
      await ctx.telegram.editMessageText(processMessage.chat.id, processMessage.message_id, null, "Убираем эхо");
      await separateAudio(sessionPath, "vocal.mp3", "DeReverb");
      vocalString += " ,без эха"
    }

    if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both") {
      await ctx.telegram.editMessageText(processMessage.chat.id, processMessage.message_id, null, "Убираем бек вокал");

      if (ctx.session.audioProcessPower === "backvocal") {
        await separateAudioVR(sessionPath, "vocal.mp3", "URV_Models/hp_5_back.pth", "/out_back",)
      } else {
        await separateAudioVR(sessionPath, "vocal_de_echo.mp3", "URV_Models/hp_5_back.pth", "/out_back")
      }
      vocalString += " ,без бек вокала"
    }

    if (ctx.session.audioProcessPower === "echo") {
      vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_echo.mp3");
    }

    if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both") {
      vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_back.mp3");
    }

    await ctx.reply(vocalString)
    await ctx.sendAudio({ source: vocalPath });

    if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "echo" || ctx.session.audioProcessPower === "both") {
      await ctx.sendAudio({ source: vocalPathDeEcho });

      // Исходный и целевой пути
      const sourcePath = `${sessionPath}/out_back/instrument_vocal_de_echo.mp3_10.wav`;
      const destinationPath = `${sessionPath}/backvocal.mp3`;
      const readyDestPath = `${sessionPath}/backvocall.mp3`

      // Переименование файла
      fs.rename(sourcePath, destinationPath, async function (err) {
        if (err) {
          console.log('ERROR: ' + err);
        }
        else {
          // Отправка файла после переименования
          await ctx.reply("Отдельно бек вокал")
          await compressMp3(destinationPath, `${sessionPath}/backvocall.mp3`)
          await ctx.sendAudio({ source: readyDestPath });
        }
      });
    }

    await ctx.reply("Инструментал")
    await ctx.sendAudio({ source: instrumentalPath });

    ctx.session.audioProcessPower = prevState
    logUserSession(ctx, "only_separate", "none")
  } catch (err) {
    ctx.reply("Произошла ошибка, попробуйте снова. Возможно файл который вы загрузили слишком большой. Должен быть не более 19мб.")
  }
}

export async function processVideo(ctx, sessionPath) {
  try {
    const filePath = `${sessionPath}/video.mp4`;
    const audioPath = `${sessionPath}/audio.mp3`;
    const vocalPath = `${sessionPath}/vocal.mp3`;
    const vocalPathDeEcho = `${sessionPath}/vocal_de_echo.mp3`;
    const audioOutPath = `${sessionPath}/audio_out_cut.mp3`;
    const instrumentalPath = `${sessionPath}/instrumental.mp3`;
    const audioFullPath = `${sessionPath}/audio_full.mp3`;
    const videoOutPath = `${sessionPath}/video_out.mp4`;


    // Загрузка видео
    const link = await ctx.telegram.getFileLink(ctx.message.video.file_id);
    await downloadFile(link, filePath);
    const message = await ctx.reply("[1/6] Скачивание видео...");
    const messageId = message.message_id;

    // Разделение звука и видео
    const [videoOutput, audioOutput] = await splitVideoAndAudio(filePath, sessionPath);
    await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, "[2/6]  Видео и аудио разделены. Разделение иструментала и Вокала...");

    // Разделение музыки и аудио
    await separateAudio(sessionPath, "audio.mp3");
    await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, "[3/6] Инструментал и вокал разделены. Преобразование голоса...");

    // Убираем эхо
    // await separateAudio(sessionPath, "vocal.mp3", "DeReverb");
    // await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, "Убираем Эхо");

    // Преобразование аудио
    await transformAudio(ctx, sessionPath, vocalPath, true);
    await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, "[4/6] Голос преобразован. Склеивание Инструментала и вокала...");

    // Склеивание вокала и инструментала
    await mergeAudioFilesToMp3(audioOutPath, instrumentalPath, audioFullPath, ctx);
    await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, "[5/6]  Вокал и инструментал склеены. Сборка видео...");

    // Склеивание аудио и видео
    await mergeAudioAndVideo(videoOutput, audioFullPath, videoOutPath);
    await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, "[6/6]  Видео собрано, отправка...");

    await ctx.sendVideo({
      source: videoOutPath,
    });

    await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, "Готово");

    try {
      const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
      const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
      const username = ctx.from.username; // получаем ник пользователя
      const sessionPath = `sessions/${uniqueId}/${messageId}`;

      const filename = `${username}.txt`;
      const filepath = path.join(sessionPath, filename);
      fs.writeFileSync(filepath, `User: ${username}\nUnique ID: ${uniqueId}\nMessage ID: ${messageId}`);
    } catch (err) {
      console.log(err)
    }

    // Удаление временных файлов
    fs.readdir(sessionPath, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err}`);
      } else {
        files.forEach(file => {
          if (file !== path.basename(videoOutPath) && file !== path.basename(filePath)) {
            fs.unlink(path.join(sessionPath, file), err => {
              if (err) console.error(`Error deleting file: ${err}`);
            });
          }
        });
      }
    });

  } catch (err) {
    console.error(`Error during video processing: ${err}`);
    ctx.reply('Извините, произошла ошибка при обработке видео.');
  }
}



export async function process_audio_file(ctx, sessionPath, filename = "audio.wav") {
  try {
    // Создаем папку сессии, если она еще не существует
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const fullSessionPath = path.join(config.get("MAIN_PATH"), sessionPath);
    const vocalPath = path.join(fullSessionPath, "vocal.mp3");

    const instrumentalPath = path.join(fullSessionPath, "instrumental.mp3");
    let sessionOutputPath = path.join(fullSessionPath, "audio_out.mp3");
    const resultPath = path.join(fullSessionPath, "result.mp3");

    let vocalPathDeEcho, vocalString;

    vocalString = "Вокал"

    let processMessage = await ctx.reply("[1/4]Разделение вокала и фоновой музыки");

    await separateAudio(sessionPath, "audio.wav");

    if (ctx.session.audioProcessPower === "echo" || ctx.session.audioProcessPower === "both") {
      // Убираем эхо
      await ctx.telegram.editMessageText(processMessage.chat.id, processMessage.message_id, null, "[2/3]Убираем эхо");
      await separateAudio(sessionPath, "vocal.mp3", "DeReverb");
      vocalString += " ,без эха"
    }

    if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both") {
      await ctx.telegram.editMessageText(processMessage.chat.id, processMessage.message_id, null, "[3/3]Убираем бек вокал");

      if (ctx.session.audioProcessPower === "backvocal") {
        await separateAudioVR(sessionPath, "vocal.mp3", "URV_Models/hp_5_back.pth", "/out_back",)
      } else {
        await separateAudioVR(sessionPath, "vocal_de_echo.mp3", "URV_Models/hp_5_back.pth", "/out_back")
      }
      vocalString += " ,без бек вокала"
    }

    if (ctx.session.audioProcessPower === "echo") {
      vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_echo.mp3");
    }

    if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both") {
      vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_back.mp3");
    }

    if (!vocalPathDeEcho) vocalPathDeEcho = vocalPath

    await ctx.reply("[2/4] Подготовка инструментала и вокала к работе");
    await ctx.sendAudio({ source: vocalPathDeEcho });
    await ctx.sendAudio({ source: instrumentalPath });

    await ctx.reply("[3/4] Преобразование извлеченного вокала");
    await transformAudio(ctx, sessionPath, vocalPathDeEcho, true);
    await ctx.sendAudio({ source: sessionOutputPath });

    if (ctx.session.autoTune) {
      await ctx.reply(`[3.5/4] Применяем автотюн на полученный голос`)
      await autotuneAudio(ctx, sessionPath, "audio_out.mp3")
      sessionOutputPath = path.join(fullSessionPath, "autotune_vocal.mp3");
    }

    if (ctx.session.reverbOn || ctx.session.echoOn) {
      await ctx.reply(`[3.5/4] Применяем эффекты на полученный голос`);
      sessionOutputPath = path.join(fullSessionPath, "autotune_vocal.mp3");

      // Проверьте, существует ли файл
      if (!fs.existsSync(sessionOutputPath)) {
        // Если файла не существует, то примените audio_out.mp3
        await improveAudio(ctx, sessionPath, "audio_out.mp3");
        sessionOutputPath = path.join(sessionPath, "audio_out_improve.mp3");
      } else {
        await improveAudio(ctx, sessionPath, "autotune_vocal.mp3");
        sessionOutputPath = path.join(sessionPath, "audio_out_improve.mp3");
      }
    }

    await ctx.reply("[4/4] Склеивание вокала и фоновой музыки");
    await mergeAudioFilesToMp3(sessionOutputPath, instrumentalPath, resultPath, ctx);

    await ctx.reply("Кавер готов, если тебя не устроил голос, то просто кидай боту это вырезанный вокал и меняй настройки. Когда тебя все устроит используй команду /merge что бы совместить вокал и инструментал");
    await ctx.sendAudio({ source: resultPath });

    try {
      const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
      const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
      const username = ctx.from.username; // получаем ник пользователя
      const sessionPath = `sessions/${uniqueId}/${messageId}`;

      const filename = `${username}.txt`;
      const filepath = path.join(sessionPath, filename);
      fs.writeFileSync(filepath, `User: ${username}\nUnique ID: ${uniqueId}\nMessage ID: ${messageId}`);
    } catch (err) {
      console.log(err)
    }

    // Удаление всех файлов в директории, кроме audio.wav, vocalPath, instrumentalPath и resultPath
    fs.readdir(sessionPath, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err}`);
      } else {
        files.forEach(file => {
          if (![path.basename(`${sessionPath}/audio.wav`), path.basename(vocalPath), path.basename(instrumentalPath), path.basename(resultPath)].includes(file)) {
            fs.unlink(path.join(sessionPath, file), err => {
              if (err) console.error(`Error deleting file: ${err}`);
            });
          }
        });
      }
    });
  } catch (err) {
    console.error(`Error during audio processing: ${err}`);
    ctx.reply('Извините, произошла ошибка при обработке аудио.');
  }
}


export function is_youtube_url(url) {
  // Регулярное выражение для проверки, является ли текст URL-адресом YouTube
  const youtube_regex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  return url.match(youtube_regex);
}


export async function process_youtube_audio(ctx, sessionPath, youtube_url) {
  await downloadFromYoutube(youtube_url, sessionPath);
  const audio_filename = "audio.wav";
  await process_audio_file(ctx, sessionPath, audio_filename);
}

export const processAiCover = async (ctx) => {
  const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
  const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
  const username = ctx.from.username; // получаем ник пользователя
  const sessionPath = `sessions/${uniqueId}/${messageId}`;
  const filename = ctx.message.audio.file_name;

  logUserSession(ctx, "cover", ctx.session.name)

  // создаем папку сессии, если она еще не существует
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  try {
    // создаем текстовый файл с именем пользователя
    let filenamee = `${username}.txt`;
    let filepath = path.join(sessionPath, filenamee = "audio.wav");
    fs.writeFileSync(filepath, `User: ${username}\nUnique ID: ${uniqueId}\nMessage ID: ${messageId}`);
  } catch (err) {
    console.log(err)
  }

  try {
    const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
    await downloadFile(link, `${sessionPath}/audio.wav`);
    ctx.reply("Обработка аудио...")

    await process_audio_file(ctx, sessionPath, filename);

    ctx.session.waitingForCover = false;
  } catch (err) {
    ctx.reply("Произошла ошибка, возможно файл слишком большой")
  }
};

async function handleAudio(ctx, sessionPath, audioPath = '', isAudio = false, messageId = null) {
  let filePath, audioSource;

  if (!audioPath) {
    let link;
    if (ctx.message.voice || ctx.message.audio) {
      link = await ctx.telegram.getFileLink((ctx.message.voice || ctx.message.audio).file_id);
    } else {
      ctx.reply("Не удалось обработать сообщение. Пожалуйста, отправьте голосовое или аудио сообщение.");
      return;
    }

    await downloadFile(link, `${sessionPath}/audio.ogg`);
    ctx.reply("Обработка аудио...");
  }

  filePath = await transformAudio(ctx, sessionPath, audioPath, true);

  await ctx.sendChatAction("upload_audio");

  if (ctx.session.phoneEffect) {
    await phoneCallEffects(ctx, sessionPath, "audio_out_cut.mp3");
  }

  if (ctx.session.reverbOn || ctx.session.echoOn || ctx.session.phoneEffect) {
    if (!ctx.session.phoneEffect) {
      await improveAudio(ctx, sessionPath, "audio_out_cut.mp3");
    }

    audioSource = `${sessionPath}/audio_out_improve.mp3`;
  } else {
    audioSource = `${sessionPath}/audio_out_cut.mp3`;
  }

  if (ctx.session.voiceOrAudioOut === "audio") {
    await ctx.sendAudio({
      source: audioSource,
      reply_to_message_id: messageId
    });
  } else {
    await convertToOgg(audioSource);
    await ctx.sendVoice({
      source: `${audioSource.slice(0, -3)}ogg`,
    });
  }
}


export const processAudioMessage = async (ctx, isAudio = false, audioPath = "", sessionPathIn = "") => {
  try {

    // Create SessionPath
    let sessionPath = createSessionFolder(ctx)
    if (sessionPathIn) {
      sessionPath = sessionPathIn;
    }
    // создаем папку сессии, если она еще не существует
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    handleAudio(ctx, sessionPath, audioPath, isAudio, ctx.message.message_id)
  } catch (err) { ctx.reply("Не удалось обработать файл, возможно он слишком большой."); }
};

export function saveSuggestion(username, suggestion) {
  const filename = 'suggestions.json';
  let data = [];

  // Если файл уже существует, читаем его содержимое
  if (fs.existsSync(filename)) {
    data = JSON.parse(fs.readFileSync(filename));
  }

  // Добавляем новое предложение
  data.push({
    username,
    date: new Date().toISOString(),
    suggestion,
  });

  // Записываем обновленные данные обратно в файл
  fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
    if (err) throw err;
    console.log(`Suggestion from ${username} has been saved.`);
  });
}


