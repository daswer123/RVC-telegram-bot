import { Markup } from "telegraf";
import { downloadFile, downloadFromYoutube, transformAudio, separateAudio, mergeAudioFilesToMp3, splitVideoAndAudio, mergeAudioAndVideo, separateAudioVR, compressMp3, logUserSession, getBannedUsers, improveAudio, autotuneAudio, convertToOgg, phoneCallEffects} from "./functions.js";
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


export async function checkForBan(ctx){
  const uniqueId = String(ctx.from.id); // получаем уникальный идентификатор пользователя и преобразуем его в строку

  const bannedUsers = await getBannedUsers();

  console.log(uniqueId, bannedUsers,bannedUsers.includes(uniqueId))

  // Проверяем, забанен ли пользователь
  if (bannedUsers.includes(uniqueId)) {
    ctx.reply("Внимание, доступ к боту заблокирован, вы были забаненны")
    return true;
  }

  return false;
}

export function protectBot(ctx){
  const isStarted = ctx?.session?.isAvalible
  if (!isStarted){
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

      if(ctx.session.audioProcessPower === "backvocal"){
        await separateAudioVR(sessionPath, "vocal.mp3", "URV_Models/hp_5_back.pth", "/out_back",)
      } else {
      await separateAudioVR(sessionPath, "vocal_de_echo.mp3", "URV_Models/hp_5_back.pth", "/out_back")
      }
      vocalString += " ,без бек вокала"
    }

    if(ctx.session.audioProcessPower === "echo"){
      vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_echo.mp3");
     }

    if(ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both"){
     vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_back.mp3");
    }

    await ctx.reply(vocalString)
    await ctx.sendAudio({ source: vocalPath });

    if(ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "echo" || ctx.session.audioProcessPower === "both"){
      await ctx.sendAudio({ source: vocalPathDeEcho });
    
      // Исходный и целевой пути
      const sourcePath = `${sessionPath}/out_back/instrument_vocal_de_echo.mp3_10.wav`;
      const destinationPath = `${sessionPath}/backvocal.mp3`;
      const readyDestPath = `${sessionPath}/backvocall.mp3`
    
      // Переименование файла
      fs.rename(sourcePath, destinationPath, async function(err) {
        if (err) {
          console.log('ERROR: ' + err);
        }
        else {
          // Отправка файла после переименования
          await ctx.reply("Отдельно бек вокал")
          await compressMp3(destinationPath,`${sessionPath}/backvocall.mp3`)
          await ctx.sendAudio({ source: readyDestPath });
        }
      });
    }
      
    await ctx.reply("Инструментал")
    await ctx.sendAudio({ source: instrumentalPath });

    ctx.session.audioProcessPower = prevState
    logUserSession(ctx,"only_separate","none")
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


// Отправить сообщение всем юзерам
export async function sendMessageToAllUsers(message, bot) {
  const sessionsDir = './sessions';
  const userIds = fs.readdirSync(sessionsDir).map(Number);

  for (const userId of userIds) {
    try {
      await bot.telegram.sendMessage(userId, message);
    } catch (error) {
      // Если пользователь заблокировал бота, пропустить и продолжить со следующим пользователем
      if (error.code === 403) {
        console.log(`Пользователь ${userId} заблокировал бота. Пропускаем.`);
        continue;
      }
      // Вывести ошибку для всех других случаев
      console.error(`Не удалось отправить сообщение пользователю ${userId}:`, error);
    }
  }
}

// Отправить сообщение определённому пользователю
export async function sendMessageToUser(userId, message, bot) {
  try {
    await bot.telegram.sendMessage(userId, message);
  } catch (error) {
    // Если пользователь заблокировал бота, выводим сообщение об ошибке
    if (error.code === 403) {
      console.log(`Пользователь ${userId} заблокировал бота.`);
    } else {
      // Выводим ошибку для всех других случаев
      console.error(`Не удалось отправить сообщение пользователю ${userId}:`, error);
    }
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

      if(ctx.session.audioProcessPower === "backvocal"){
        await separateAudioVR(sessionPath, "vocal.mp3", "URV_Models/hp_5_back.pth", "/out_back",)
      } else {
      await separateAudioVR(sessionPath, "vocal_de_echo.mp3", "URV_Models/hp_5_back.pth", "/out_back")
      }
      vocalString += " ,без бек вокала"
    }

    if(ctx.session.audioProcessPower === "echo"){
      vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_echo.mp3");
     }

    if(ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both"){
     vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_back.mp3");
    }

    if(!vocalPathDeEcho) vocalPathDeEcho = vocalPath

    await ctx.reply("[2/4] Подготовка инструментала и вокала к работе");
    await ctx.sendAudio({ source: vocalPathDeEcho });
    await ctx.sendAudio({ source: instrumentalPath });

    await ctx.reply("[3/4] Преобразование извлеченного вокала");
    await transformAudio(ctx, sessionPath, vocalPathDeEcho, true);
    await ctx.sendAudio({ source: sessionOutputPath });

    if(ctx.session.autoTune){
      await ctx.reply(`[3.5/4] Применяем автотюн на полученный голос`)
      await autotuneAudio(ctx,sessionPath,"audio_out.mp3")
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

  logUserSession(ctx,"cover",ctx.session.name)

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

  try{
  const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
  await downloadFile(link, `${sessionPath}/audio.wav`);
  ctx.reply("Обработка аудио...")

  await process_audio_file(ctx, sessionPath, filename);

  ctx.session.waitingForCover = false;
  }catch(err){
    ctx.reply("Произошла ошибка, возможно файл слишком большой")
  }
};

export const processAudioMessage = async (ctx, isAudio = false, audioPath = "", sessionPathIn = "") => {
  try{
  ;
  const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
  const username = ctx.from.username; // получаем ник пользователя
  const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
  let sessionPath = `sessions/${uniqueId}/${messageId}`;

  if (sessionPathIn) {
    sessionPath = sessionPathIn;
  }

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

  if (!audioPath) {
    let link;
    if (ctx.message.voice) {
      link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    } else if (ctx.message.audio) {
      link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
    } else {
      ctx.reply("Не удалось обработать сообщение. Пожалуйста, отправьте голосовое или аудио сообщение.");
      return;
    }

    await downloadFile(link, `${sessionPath}/audio.ogg`);
    ctx.reply("Обработка аудио...")
  } else {
    const filePath = await transformAudio(ctx, sessionPath, audioPath, true);

    await ctx.sendChatAction("upload_audio");

    await ctx.sendChatAction("upload_audio");

    

    if(ctx.session.reverbOn || ctx.session.echoOn || ctx.session.phoneEffect){

      if(ctx.session.phoneEffect){
        await phoneCallEffects(ctx,sessionPath,"audio_out_cut.mp3")
      } else {
        await improveAudio(ctx,sessionPath,"audio_out_cut.mp3")
      }    
      
      await ctx.sendAudio({
        source: `${sessionPath}/audio_out_improve.mp3`,
        reply_to_message_id: messageId // отвечаем на исходное сообщение
      });

    } else{
      await ctx.sendAudio({
        source: `${sessionPath}/audio_out_cut.mp3`,
        reply_to_message_id: messageId // отвечаем на исходное сообщение
      });
    }
    

    return
  }


  if (isAudio) {
    const filePath = await transformAudio(ctx, sessionPath, "", true);

    await ctx.sendChatAction("upload_audio");

    if(ctx.session.phoneEffect){
      await phoneCallEffects(ctx,sessionPath,"audio_out_cut.mp3")
    }

    if(ctx.session.reverbOn || ctx.session.echoOn || ctx.session.phoneEffect){

      if(ctx.session.phoneEffect){
        await phoneCallEffects(ctx,sessionPath,"audio_out_cut.mp3")
      } else {
        await improveAudio(ctx,sessionPath,"audio_out_cut.mp3")
      }
      
      await ctx.sendAudio({
        source: `${sessionPath}/audio_out_improve.mp3`,
        reply_to_message_id: messageId // отвечаем на исходное сообщение
      });

    } else{
    await ctx.sendAudio({
      source: `${sessionPath}/audio_out_cut.mp3`,
      reply_to_message_id: messageId // отвечаем на исходное сообщение
    });
  }
  } else {
    const filePath = await transformAudio(ctx, sessionPath, "", true);
    await ctx.sendChatAction("upload_audio");

    if(ctx.session.phoneEffect){
      await phoneCallEffects(ctx,sessionPath,"audio_out_cut.mp3")
    }

    if(ctx.session.reverbOn || ctx.session.echoOn || ctx.session.phoneEffect){

      if(ctx.session.phoneEffect){
        await phoneCallEffects(ctx,sessionPath,"audio_out_cut.mp3")
      } else {
        await improveAudio(ctx,sessionPath,"audio_out_cut.mp3")
      }
      
      // await ctx.sendVoice({
      //   source: `${sessionPath}/audio_out_improve.mp3`,
      //   reply_to_message_id: messageId // отвечаем на исходное сообщение
      // });
      // return

    } 

    if(ctx.session.voiceOrAudioOut === "audio"){
      if(ctx.session.reverbOn || ctx.session.echoOn || ctx.session.phoneEffect){
      await ctx.sendAudio({
        source: `${sessionPath}/audio_out_improve.mp3`,
      });
      return
    } else {
      await ctx.sendAudio({
        source: `${sessionPath}/audio_out_cut.mp3`,
      });
      return
    }
    } else {
      if(ctx.session.reverbOn || ctx.session.echoOn || ctx.session.phoneEffect){
      await convertToOgg(`${sessionPath}/audio_out_improve.mp3`)
      await ctx.sendVoice({
        source: `${sessionPath}/audio_out_improve.ogg`,
      });
      return
    } else {
      await convertToOgg(`${sessionPath}/audio_out_cut.mp3`)
      await ctx.sendVoice({
        source: `${sessionPath}/audio_out_cut.ogg`,
      });
      return
    }
    }    

  }
}catch(err){ctx.reply("Не удалось обработать файл, возможно он слишком большой.");}};

export async function deletePreviousMessage(ctx) {
  if (ctx.session.previousMessageId) {
    try {
      await ctx.deleteMessage(ctx.session.previousMessageId);
    } catch (err) {
      console.log("Ошибка при удалении сообщения:", err);
    }
  }
}

export const loadSettings = async (ctx) => {
  try{
  const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
  const sessionPath = path.join('sessions', String(uniqueId));
  const presetsFilePath = path.join(sessionPath, 'presets.json');

  // Если файл presets.json уже существует, прочитаем его
  if (fs.existsSync(presetsFilePath)) {
    const presetsFileContent = fs.readFileSync(presetsFilePath);
    const presets = JSON.parse(presetsFileContent);

    // Если в файле нет пресетов, сообщим об этом пользователю
    if (Object.keys(presets).length === 0) {
      ctx.reply('На данный момент у вас нет сохраненных пресетов.', Markup.inlineKeyboard([
        Markup.button.callback('Меню', 'menu')
      ]));
    } else {
      // Создаем кнопки для каждого пресета
      const buttons = Object.keys(presets).map(presetName => {
        return Markup.button.callback(presetName, `select_preset:${presetName}`);
      });

      // Добавляем кнопку "Меню"
      buttons.push(Markup.button.callback('Меню', 'menu'));

      // Отправляем пользователю меню с пресетами
      ctx.reply('Выберите пресет для загрузки:', Markup.inlineKeyboard(buttons, { columns: 2 }).resize());
    }
  } else {
    // Если файл presets.json не существует, сообщим об этом пользователю
    ctx.reply('У вас нет сохраненных пресетов.', Markup.inlineKeyboard([
      Markup.button.callback('Меню', 'menu')
    ]));
  }
}catch(err){
    ctx.reply("Произошла ошибка, файл с пресетами был удален")

    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
    const sessionPath = path.join('sessions', String(uniqueId));
    const presetsFilePath = path.join(sessionPath, 'presets.json');
    if (fs.existsSync(presetsFilePath)) {
      fs.unlink(presetsFilePath, (err) => {
        if (err) {
          console.error(`Ошибка при удалении файла: ${err}`);
        }
      });
    }
  }
}

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

export const showMenuBtn = async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback("Меню", "menu"),
  ]).resize();

  const message = await ctx.reply('...', keyboard);
  await ctx.replyWithMarkdown("ㅤ", keyboard);
};

export const showMenu = async (ctx) => {
  const message = `*Меню*\n\n\Ваш текущий персонаж: *${ctx.session.name}*\n\Пресет голоса: *${ctx.session.voice_preset}*\nPich: ${ctx.session.pith}\nВы можете сделать предложение по улучшению функционала бота, для этого выберите специальный пункт в меню\n\nВы можете прислать текст и он будет озвучен голосом персонажа ( голос будет роботизированным )\n\nОтправьте голосовое или перешлите уже сделанное, так же вы можете кинуть аудиофайл`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(`Выбрать персонажа`, "characters"),Markup.button.callback(`Показать текущие настройки`, "current_settings")],
    [Markup.button.callback(`Сделать AI кавер`, "cover"), Markup.button.callback(`Разделить аудио`, "separate") ],
    [Markup.button.callback("Меню создания голосовых моделей", "show_create_voice_menu")],
    [Markup.button.callback("Настройки голоса", "settings"), Markup.button.callback(`Настройка AI Кавера`, "aisettings")],
    [Markup.button.callback(`Сохранить настройки`, "save_preset"), Markup.button.callback(`Загрузить настройки`, "load_preset")],
    [Markup.button.callback(`Предложения по улучшению бота`, "make_predlog"),Markup.button.callback(`Поддержать автора`, "support")],
  ]).resize();

  await ctx.replyWithMarkdown(message, keyboard);
  return message
};

export async function showCreateMenu(ctx){
  const message = `Меню создания голосовой модели\nПеред началом инициализируйте модель\nПродолжительность вашего набора данных должна быть 90 секунд или более\n\nНазвание вашей модели:  ${ctx.session.voiceModelName ? ctx.session.voiceModelName :  "Ещё не названно"}\nОписание вашей модели:  ${ctx.session.voiceModelDesc ? ctx.session.voiceModelDesc :  "Не указанно"}\nПол вашей модели:  ${ctx.session.voiceModelGender ? ctx.session.voiceModelGender :  "Не указанно"}`

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(`Инициализоровать голосовую модель`, "create_voice_name")],
    [Markup.button.callback(`Добавить голосовой или аудиообразец голоса`, "create_voice_add_sample")],
    [Markup.button.callback(`Получить текст для озвучивания`, "create_voice_random_text")],
    [Markup.button.callback(`Информация о создание и сроках`, "create_voice_info")],
    [Markup.button.callback("Завершить процедуру для создание модели","create_voice_end")],
    [Markup.button.callback(`Назад`, "menu")],
  ]).resize();

  await ctx.replyWithMarkdown(message, keyboard);
  return message
}

export async function showAdminMenu(ctx){
  const message = `Добро пожаловать в админ меню\nСдесь вы можете:\nЗабанить пользователя\nПосмотреть статистику использования голосов\nОтрегулировать мощность\nПрислать сообщение определенному пользователю\nПрислать сообщение всем пользователям.`

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(`Забанить пользователя`, "admin_ban_user"),Markup.button.callback(`Разбанить пользователя`, "admin_unban_user")],
    [Markup.button.callback(`Посмотреть статистику использования голосов`, "admin_show_stats"),Markup.button.callback(`Очистить папку sessions`, "admin_clear_folder")],
    [Markup.button.callback(`Отрегулировать мощность`, "admin_control_power"),Markup.button.callback(`Показать ID Всех пользователей`, "get_all_user_id")],
    [Markup.button.callback(`Отправить сообщение пользователю`, "admin_send_msg_сurrent"),Markup.button.callback(`Отправить сообщение всем`, "admin_send_msg_all")],
    [Markup.button.callback(`Назад`, "menu")],
  ]).resize();

  await ctx.replyWithMarkdown(message, keyboard);
  return message
}

export async function showCurrentSettings(ctx) {
  const session = ctx.session;

  const photo = { source: fs.readFileSync(session.char_photo) };
  const newMessage = await ctx.replyWithPhoto(photo);

  const message = `Текущие настройки сессии: ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\n` +
    `Высота тона: ${session.pith}\n` +
    `Метод: ${session.method}\n` +
    `Размер mangio-crepe hop: ${session.mangio_crepe_hop}\n` +
    `Сила влияния индекса: ${session.feature_ratio}\n` +
    `Защита голоса: ${session.protect_voiceless}\n` +
    `Имя: ${session.name}\n` +
    `Ваш пол: ${session.voice_preset} \n` +
    `Голос текстовой модели: ${session.voiceActor}`;

  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback("Назад", "menu"),
  ])

  await ctx.replyWithMarkdown(message, keyboard);
  await deletePreviousMessage(ctx);
};

export function noteOctaveToFrequency(note, octave) {
  var noteMap = {
      'C': -9,
      'C#': -8,
      'Db': -8,
      'D': -7,
      'D#': -6,
      'Eb': -6,
      'E': -5,
      'F': -4,
      'F#': -3,
      'Gb': -3,
      'G': -2,
      'G#': -1,
      'Ab': -1,
      'A': 0,
      'A#': 1,
      'Bb': 1,
      'B': 2
  };

  var noteNumber = noteMap[note.toUpperCase()] + (octave - 4) * 12;
  var a4Freq = 440;
  var frequency = a4Freq * Math.pow(2, noteNumber / 12);

  // Ограничиваем диапазон частоты от 1 до 16000 Гц
  if (frequency < 1) {
    return 1;
  } else if (frequency > 16000) {
    return 16000;
  } else {
    return frequency;
  }
}

export async function showSettings(ctx) {
  
  const session = ctx.session;

  const pithDescription = "Pith - вв тона, если выбираешь женскую модель но ты мужчина ставь 12, если наоборот -12, если пол совпадает то 0";
  const methodDescription = "Method - Метод обработки голоса: harvest - лучше выделяет особенности голоса , crepe - более медленный, но лучше обрабатывает голос в целом, mango-crepe - Улучшенный вариант creep с возможностью выбрать Mangio-Crepe Hop";
  const mangioCrepeHopDescription = "Mangio-Crepe Hop - означает время, необходимое говорящему для перехода на резкую высоту тона. При меньшей длине скачка требуется больше времени, чтобы сделать вывод, но он более точен. Оптимальное значение 128";
  const featureRatioDescription = "Feature ratio - На сколько голос будет подкоректирован согласно речевым особенностям модели, может вызвать эффект метала";
  const protectVoicelessDescription = "Protect voiceless - Защита безголосых согласных и звуков дыхания для предотвращения артефактов музыки. Установите значение0,5 для отключения. Уменьшите значение для усиления защиты, но это может снизить точность индексирования";
  const voiceActorDescription = "Модель для голоса - Изначальный голос для преобразования модели из текста в речь"
  const outputType = "Тип ответа - Тип присылаемого аудио в ответ на голосовое, 2 режима - audio и voice"

  const autoTuneDesc = `Автотюн, который регулируется нейросетью, конфликтует с автотюном в эффектах, так что может работать только 1` 
  const aboutMinMax = `Min-Max Pitch, определяет допустимый диапазон частоты (pitch), применяемый в методе rmvpe+.\nДопустимые значения в Гц варьируются от 1 до 16000.Также вы можете использовать музыкальные ноты для определения диапазона.Например, 'C0' соответствует частоте примерно 16 Гц, а 'E10' соответствует частоте примерно 15600 Гц.` 

  const settingsMessage = [pithDescription, aboutMinMax, methodDescription, mangioCrepeHopDescription, featureRatioDescription, protectVoicelessDescription,autoTuneDesc, voiceActorDescription,outputType].join("\n\n");

  const settingsKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback(`Pith: ${session.pith}`, "set_pith"), Markup.button.callback(`Method: ${session.method}`, "set_method")],
    [Markup.button.callback(`Mangio-Crepe Hop: ${session.mangio_crepe_hop}`, "set_mangio_crepe_hop"), Markup.button.callback(`Feature Ratio: ${session.feature_ratio}`, "set_feature_ratio")],
    [Markup.button.callback(`Protect Voiceless: ${session.protect_voiceless}`, "set_protect_voiceless"),Markup.button.callback(`Изменить скорость речи ${session.voice_speed}`, "set_voice_speed")],
    [Markup.button.callback(`Min Pith: ${session.minPich}`, "set_minPich"),Markup.button.callback(`Max Pith ${session.maxPich}`, "set_maxPich")],
    [Markup.button.callback(`Autotune: ${session.neuroAutoTune}`,"toggle_autotune")],
    [Markup.button.callback(`Изменить текстовую голосовую модель ${session.voiceActor}`, "set_voice")],
    [Markup.button.callback(`Тип ответа на голосовое: ${session.voiceOrAudioOut}`, "set_out_voice")],
    [Markup.button.callback("Меню", "menu")],
  ]).resize();

  await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  await deletePreviousMessage(ctx);
}

export async function showAICoverSettings(ctx) {
  
  const session = ctx.session;

  const mainDesk = "Тут вы увидете настройки которые нужны для создания ИИ кавера и разделения аудио на вокал и инструментал по команде /separate"
  const vocalVolumeDescription = "Громкость вокала - Уровень громкости вокала может быть от 0 до 3";
  const instrumentalVolumeDescription = "Громкость инструментала - Уровень громкости инструментала может быть от 0 до 3";
  const audioProcessPowerDescription = "Модификаторы при обработке вокала - есть 3 модификатора, echo - убрать эхо из вокала, backvocal - убрать бэк вокал и both - убрать и то и то\nКаждый модификатор добавляет примерно по дополнительной минуте"
  const echoDesc = `Добавить эхо, сейчас оно - ${ctx.session.echoOn === true ? "Включенно" : "Выключенно"}`
  const reverbDesc = `Добавить реверберацию, сейчас она - ${ctx.session.reverbOn === true ? "Включенна" : "Выключенна"}`
  const autoTuneDesc = `Добавить автотюн, сейчас он - ${ctx.session.autoTune === true ? "Включенн" : "Выключенн"}`

  const settingsMessage = [mainDesk,vocalVolumeDescription, instrumentalVolumeDescription,audioProcessPowerDescription,reverbDesc,echoDesc,autoTuneDesc].join("\n\n");

  const settingsKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback(`Громкость вокала: ${session.voice_volume}`, "set_vocal_volume")], 
    [Markup.button.callback(`Громкость инструментала: ${session.instrumnet_volume}`, "set_instrumental_volume")],
    [Markup.button.callback("Модификаторы при разделении аудио", "set_audio_process_power")],
    [Markup.button.callback("Включить реверберацию", "toggle_audio_reverb"), Markup.button.callback("Включить эхо", "toggle_audio_echo")],
    [Markup.button.callback("Включить автотюн", "toggle_audio_autotune"),Markup.button.callback("Включить эффект телефона", "toggle_audio_phoneEffect")],
    [Markup.button.callback("Настройка эффектов", "effects_settings")],
    [Markup.button.callback("Меню", "menu")],
]).resize();

await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);

  try{
  await deletePreviousMessage(ctx);
  }catch(err){
    console.log(err)
  }
}


export async function showEffectsSettings(ctx){

  const session = ctx.session;

  const settingsKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback("Эхо: Задержка - " + session.echoDelay, "effect_echo_delay"), Markup.button.callback("Эхо: Громкость - "+ session.echoPower, "effect_echo_power")],
    [Markup.button.callback("Реверберация: Сила эффекта - "+session.reverbPower, "effect_reverb")],
    [Markup.button.callback("Автотюн: Воздействие - "+session.autotune_attack, "effect_autotune_attack"), Markup.button.callback("Автотюн: Сила - "+session.autotune_strength, "effect_autotune_str")],
    [Markup.button.callback("Назад", "aisettings")],
  ]).resize();

  await ctx.replyWithMarkdown("Меню настройки эффектов", settingsKeyboard);
}