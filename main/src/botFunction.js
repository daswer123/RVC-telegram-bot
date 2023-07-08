import { Markup } from "telegraf";
import { downloadFile, downloadFromYoutube, transformAudio, separateAudio,mergeAudioFilesToMp3 } from "./functions.js";
import { INITIAL_SESSION } from "./variables.js";
import config from "config";
import fs from "fs";

// Ваша функция для отправки сообщения всем пользователям
export async function sendMessageToAllUsers(message,bot) {
  const sessionsDir = './sessions';
  const userIds = fs.readdirSync(sessionsDir).map(Number);
  
  for (const userId of userIds) {
    try {
      await bot.telegram.sendMessage(userId, message);
    } catch (error) {
      console.error(`Не удалось отправить сообщение пользователю ${userId}:`, error);
    }
  }
}


export async function process_audio_file(ctx, sessionPath, filename = "") {
         // Создаем папку сессии, если она еще не существует
         if (!fs.existsSync(sessionPath)) {
           fs.mkdirSync(sessionPath, { recursive: true });
         }
       
        await ctx.reply("[1/4] Разделение вокала и фоновой музыки");
        await separateAudio(sessionPath,filename);

        await ctx.reply("[2/4] Подготовка инструментала и вокала к работе");

        const vocalPath = config.get("MAIN_PATH") + "\\" + sessionPath + "\\" + "vocal.mp3"
        const InstrumentalPath = config.get("MAIN_PATH") + "\\" + sessionPath + "\\" + "instrumental.mp3"


        await ctx.reply("Используй этот вокал для тестирования различных настроек");
        await ctx.sendAudio({
          source: vocalPath,
        });

        await ctx.reply("Используй этот фон, когда найдешь идеальный настройки для вокала. Используй его с помощью другой комманды которая обьеденит вокал и инструментал");
        await ctx.sendAudio({
          source: InstrumentalPath,
        });

        await ctx.reply("[3/4] Преобразование извлеченного вокала");
        await transformAudio(ctx.session,sessionPath,vocalPath,true);

        await ctx.reply("[4/4] Склеивание вокала и фоновой музыки");

        const fullSessonPath = config.get("MAIN_PATH") + "\\" + sessionPath
        
        const sessionOutputPath = fullSessonPath + "\\" + "audio_out.mp3";

        console.log(`sessionOutputPath: ${sessionOutputPath}`, `InstrumentalPath: ${InstrumentalPath}`, `fullSessonPath: ${fullSessonPath}\\result.mp3`)

        await mergeAudioFilesToMp3(sessionOutputPath, InstrumentalPath , fullSessonPath + "\\result.mp3",ctx)

        await ctx.reply("Кавер готов, если тебя не устроил голос, то просто кидай боту это вырезанный вокал и меняй настройки. Когда тебя все устроит используй команду /merge что бы совместить вокал и инструментал");
        await ctx.sendAudio({
          source: `${sessionPath}/result.mp3`,
        });
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
        const sessionPath = `sessions/${uniqueId}/${messageId}`;
        const filename = ctx.message.audio.file_name;

         // создаем папку сессии, если она еще не существует
         if (!fs.existsSync(sessionPath)) {
           fs.mkdirSync(sessionPath, { recursive: true });
         }

        const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
        await downloadFile(link, `${sessionPath}/audio.wav`);
        ctx.reply("Обработка аудио...")

        await process_audio_file(ctx, sessionPath, filename);

        ctx.session.waitingForCover = false;
};

export const processAudioMessage = async (ctx,isAudio = false) => {
  ctx.session ??= { ...INITIAL_SESSION };
  const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
  const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
  const sessionPath = `sessions/${uniqueId}/${messageId}`;

  // создаем папку сессии, если она еще не существует
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

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

  if (isAudio){
    const filePath = await transformAudio(ctx.session, sessionPath,"", true);

    await ctx.sendChatAction("upload_audio");
    await ctx.sendAudio({
      source: `${sessionPath}/audio_out_cut.mp3`,
      reply_to_message_id: messageId // отвечаем на исходное сообщение
    });
  } else {
    const filePath = await transformAudio(ctx.session, sessionPath);
    await ctx.sendChatAction("upload_voice");
    await ctx.sendVoice({
      source: `${sessionPath}/audio_out.ogg`,
      reply_to_message_id: messageId // отвечаем на исходное сообщение
    });

  }
};

export async function deletePreviousMessage(ctx) {
  if (ctx.session.previousMessageId) {
    try {
      await ctx.deleteMessage(ctx.session.previousMessageId);
    } catch (err) {
      console.log("Ошибка при удалении сообщения:", err);
    }
  }
}

export const showMenuBtn = async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback("Меню", "menu"),
  ]).resize();

  const message = await ctx.reply('...', keyboard);
  await ctx.replyWithMarkdown("ㅤ", keyboard);
};

export const showMenu = async (ctx) => {
  const message = `*Меню*\n\n\Ваш текущий персонаж: *${ctx.session.name}*\n\Пресет голоса: *${ctx.session.voice_preset}*\nPich: ${ctx.session.pith}\n\nОтправьте голосовое или перешлите уже сделанное, так же вы можете кинуть аудиофайл`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("Настройки", "settings"), Markup.button.callback(`Выбрать персонажа`, "characters")],
    [Markup.button.callback(`Показать текущие настройки`, "current_settings")],
    [Markup.button.callback(`Сделать ИИ кавер`, "cover")],
  ]).resize();

  await ctx.replyWithMarkdown(message, keyboard);
  return message
};

export async function showCurrentSettings(ctx) {
  const session = ctx.session;

  const photo = { source: fs.readFileSync(session.char_photo) };
  const newMessage = await ctx.replyWithPhoto(photo);

  const message = `Текущие настройки сессии: ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\n` +
                  `Высота тона: ${session.pith}\n` +
                  `Метод: ${session.method}\n` +
                  `Размер mangio-crepe hop: ${session.mangioCrepeHop}\n` +
                  `Сила влияния индекса: ${session.featureRatio}\n` +
                  `Защита голоса: ${session.protectVoiceless}\n` +
                  `Имя: ${session.name}\n` +
                  `Ваш пол: ${session.voice_preset}`;

  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback("Назад", "menu"),
  ])

  await ctx.replyWithMarkdown(message, keyboard);
  await deletePreviousMessage(ctx);
};

export async function showSettings(ctx) {
  ctx.session ??= {...INITIAL_SESSION}
  const session = ctx.session;

  const pithDescription = "Pith - высота тона, если выбираешь женскую модель но ты мужчина ставь 12, если наоборот -12, если пол совпадает то 0";
  const methodDescription = "Method - Метод обработки голоса: harvest - лучше выделяет особенности голоса , crepe - более медленный, но лучше обрабатывает голос в целом, mango-crepe - Улучшенный вариант creep с возможностью выбрать Mangio-Crepe Hop";
  const mangioCrepeHopDescription = "Mangio-Crepe Hop - означает время, необходимое говорящему для перехода на резкую высоту тона. При меньшей длине скачка требуется больше времени, чтобы сделать вывод, но он более точен. Оптимальное значение 128";
  const featureRatioDescription = "Feature ratio - На сколько голос будет подкоректирован согласно речевым особенностям модели, может вызвать эффект метала";
  const protectVoicelessDescription = "Protect voiceless - Защита безголосых согласных и звуков дыхания для предотвращения артефактов музыки. Установите значение0,5 для отключения. Уменьшите значение для усиления защиты, но это может снизить точность индексирования";
  const vocalVolumeDescription = "Громкость вокала - Уровень громкости вокала может быть от 0 до 3";
  const instrumentalVolumeDescription = "Громкость инструментала - Уровень громкости инструментала может быть от 0 до 3";

  const settingsMessage = [pithDescription, methodDescription, mangioCrepeHopDescription, featureRatioDescription, protectVoicelessDescription, vocalVolumeDescription, instrumentalVolumeDescription].join("\n\n");

  const settingsKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback(`Pith: ${session.pith}`, "set_pith"), Markup.button.callback(`Method: ${session.method}`, "set_method")],
    [Markup.button.callback(`Mangio-Crepe Hop: ${session.mangioCrepeHop}`, "set_mangio_crepe_hop"), Markup.button.callback(`Feature Ratio: ${session.featureRatio}`, "set_feature_ratio")],
    [Markup.button.callback(`Protect Voiceless: ${session.protectVoiceless}`, "set_protect_voiceless"), Markup.button.callback(`Изменить персонажа`, "characters")],
    [Markup.button.callback(`Гр. вокала: ${session.voice_volume}`, "set_vocal_volume"), Markup.button.callback(`Гр. инструментала: ${session.instrumnet_volume}`, "set_instrumental_volume")],
    [Markup.button.callback("Меню", "menu")],
  ]).resize();

  await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  await deletePreviousMessage(ctx);
}