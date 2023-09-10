import { Markup } from "telegraf";
import { downloadFile, downloadFromYoutube, transformAudio, separateAudio, mergeAudioFilesToMp3, splitVideoAndAudio, mergeAudioAndVideo, compressMp3, logUserSession, improveAudio, autotuneAudio, convertToOgg, phoneCallEffects, handleAICover, handleSeparateAudio } from "./functions.js";
import { INITIAL_SESSION, handleAICoverMaxQueue, separateAudioMaxQueue, transfromAudioMaxQueue } from "./variables.js";
import config from "config";
import fs from "fs";
import path from "path";
import axios from "axios";
import { getBannedUsersFromDB, getUserFromDatabase, getUserOperationsCountFromDatabase, saveSuggestiontoDataBase } from "./server/db.js";


export async function tranformAudioServer(ctx, sessionPath, audioPath = "", setMp3 = false, ctxx = "") {
  try {
    const response = await axios.post('http://localhost:8081/transformAudio', {
      session: ctx.session,
      sessionPath: sessionPath,
      audioPath: audioPath,
      setMp3: true,
      ctxx: '',
      userId: ctx.from.id
    });

    // console.log(response.data.message);
  } catch (error) {
    console.log('Error transforming audio:', error.message);
  }
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
  // return
  const uniqueId = String(ctx.from.id); // получаем уникальный идентификатор пользователя и преобразуем его в строку
  const username = ctx.from.username; // получаем ник пользователя

  const bannedUsers = await getBannedUsersFromDB();

  // console.log(uniqueId, bannedUsers, bannedUsers.includes(uniqueId))

  // Проверяем, забанен ли пользователь
  if (bannedUsers.includes(uniqueId) || bannedUsers.includes(username)) {
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
    // await separateAudio(sessionPath, "audio.mp3");
    separateAudio(sessionPath, "audio.mp3")

    await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, "[3/6] Инструментал и вокал разделены. Преобразование голоса...");

    // Убираем эхо
    // await separateAudio(sessionPath, "vocal.mp3", "DeReverb");
    // await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, "Убираем Эхо");

    // Преобразование аудио
    // await transformAudio(ctx, sessionPath, vocalPath, true);
    await tranformAudioServer(ctx, sessionPath, vocalPath, true)

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
    if (checkForLimits(ctx, "handleAICover", handleAICoverMaxQueue)) return


    ctx.reply("Ваш запрос на создание AI кавера был добавлен в очередь, ожидайте\nТекущую очередь вы можете увидеть по команде /pos");

    const response = await axios.post('http://localhost:8081/handleAICover', {
      session: ctx.session,
      sessionPath: sessionPath,
      filename: filename,
      userId: ctx.from.id
    });

    const { vocalPathDeEcho, sessionOutputPath, instrumentalPath, resultPath } = response.data;

    await ctx.reply("Разделенный Вокал и инструментал\nВы можете отдельно обработать голос, переслав его боту, что бы подобрать оптимальные настройки");
    await ctx.sendAudio({ source: vocalPathDeEcho });
    await ctx.sendAudio({ source: instrumentalPath });

    await ctx.reply("Преобразованный вокал");
    await ctx.sendAudio({ source: sessionOutputPath });

    await ctx.reply("Кавер готов, если тебя не устроил голос, то просто кидай боту это вырезанный вокал и меняй настройки. Когда тебя все устроит используй команду /merge что бы совместить вокал и инструментал");
    await ctx.sendAudio({ source: resultPath });

    await logUserSession(ctx, "AiCover")

  } catch (error) {
    console.error(`Error during audio processing: ${error}`);
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
    const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
    await downloadFile(link, `${sessionPath}/audio.wav`);

    await process_audio_file(ctx, sessionPath, filename);

    ctx.session.waitingForCover = false;
  } catch (err) {
    ctx.reply("Произошла ошибка, возможно файл слишком большой")
  }
};

export function checkForLimits(ctx, operationType, limit) {
  const user = getUserFromDatabase(ctx.from.id);
  const userOperationsCount = getUserOperationsCountFromDatabase(ctx.from.id, operationType);

  if (user && (user.status === 'admin' || ctx.from.id === 225703666)) return false

  if (userOperationsCount >= limit) {
    // Если у пользователя уже есть 3 или больше операций transformAudio в очереди, отправить ему сообщение и прекратить выполнение функции
    console.log('User has too many transformAudio operations in queue. Please wait until your previous operations are complete.');
    ctx.reply(`Количество запросов для ${operationType}, превысило лимит ( ${limit} ) , пожалуйста подождите когда ваши запросы обработаются.\nТекущие запросы в очереди вы можете посмотреть с помощью комманды /pos`)
    return true;
  }
}

async function handleAudio(ctx, sessionPath, audioPath = '', isAudio = false, messageId = null, logInfo = "") {
  let filePath, audioSource;
  if (checkForLimits(ctx, "transformAudio", transfromAudioMaxQueue)) return


  if (!audioPath) {
    let link;
    if (ctx.message.voice || ctx.message.audio) {
      link = await ctx.telegram.getFileLink((ctx.message.voice || ctx.message.audio).file_id);
    } else {
      ctx.reply("Не удалось обработать сообщение. Пожалуйста, отправьте голосовое или аудио сообщение.");
      return;
    }

    await downloadFile(link, `${sessionPath}/audio.ogg`);
    ctx.reply("Запрос на преобразование голоса поставлен в очередь, ожидайте.\nТекущую очередь вы можете увидеть по команде /pos");
  }

  // console.log(ctx, "popa", audioPath)
  await tranformAudioServer(ctx, sessionPath, audioPath, true)
  await logUserSession(ctx, "transformAudio", logInfo)

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


export const processAudioMessage = async (ctx, isAudio = false, audioPath = "", sessionPathIn = "", logInfo = "") => {
  try {

    if (checkForLimits(ctx, "transformAudio", transfromAudioMaxQueue)) return

    // Create SessionPath
    let sessionPath = createSessionFolder(ctx)
    if (sessionPathIn) {
      sessionPath = sessionPathIn;
    }
    // создаем папку сессии, если она еще не существует
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    console.log(audioPath)
    await handleAudio(ctx, sessionPath, audioPath, isAudio, ctx.message.message_id, logInfo)
  } catch (err) { ctx.reply("Не удалось обработать файл, возможно он слишком большой."); }
};

export async function saveSuggestion(username, suggestion) {
  await saveSuggestiontoDataBase(username, suggestion)
}


