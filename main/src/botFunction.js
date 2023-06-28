import { Markup } from "telegraf";
import { downloadFile, transformAudio } from "./functions.js";
import fs from "fs";

export const processVoiceMessage = async (ctx) => {
  ctx.session ??= { ...INITIAL_SESSION };
  const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
  const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
  const sessionPath = `sessions/${uniqueId}/${messageId}`;

  // создаем папку сессии, если она еще не существует
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
  await downloadFile(link, `${sessionPath}/audio.ogg`);
  ctx.reply("Обработка аудио...")

  const filePath = await transformAudio(ctx.session, sessionPath);
  await ctx.sendChatAction("upload_voice");
  await ctx.sendVoice({
    source: `${sessionPath}/audio_out.ogg`,
    reply_to_message_id: messageId // отвечаем на исходное сообщение
  });
};

export const showMenuBtn = async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback("Меню", "menu"),
  ]).resize();

  const message = await ctx.reply('...', keyboard);
  await ctx.replyWithMarkdown("ㅤ", keyboard);
};

export const showMenu = async (ctx) => {
  const message = `*Меню*\n\n\ Ваш текущий персонаж *${ctx.session.name}* \n\ Пресет голоса *${ctx.session.voice_preset}* \n\nВыберите действие:\n\n- Настройки: изменить настройки голоса\n- Выбрать персонажа: выбрать другого персонажа\n- Показать текущие настройки: просмотреть текущие настройки и выбраного персонажа`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("Настройки", "settings"), Markup.button.callback(`Выбрать персонажа`, "characters")],
    [Markup.button.callback(`Показать текущие настройки`, "current_settings")],
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
};

export async function showSettings(ctx) {
  ctx.session ??= {...INITIAL_SESSION}
  const session = ctx.session;

  const pithDescription = "Pith - высота тона, если выбираешь женскую модель но ты мужчина ставь 12, если наоборот -12, если пол совпадает то 0";
  const methodDescription = "Method - Метод обработки голоса: harvest - лучше выделяет особенности голоса , crepe - более медленный, но лучше обрабатывает голос в целом, mango-crepe - Улучшенный вариант creep с возможностью выбрать Mangio-Crepe Hop";
  const mangioCrepeHopDescription = "Mangio-Crepe Hop - означает время, необходимое говорящему для перехода на резкую высоту тона. При меньшей длине скачка требуется больше времени, чтобы сделать вывод, но он более точен. Оптимальное значение 128";
  const featureRatioDescription = "Feature ratio - На сколько голос будет подкоректирован согласно речевым особенностям модели, может вызвать эффект метала";
  const protectVoicelessDescription = "Protect voiceless - Защита безголосых согласных и звуков дыхания для предотвращения артефактов музыки. Установите значение0,5 для отключения. Уменьшите значение для усиления защиты, но это может снизить точность индексирования";

  const settingsMessage = [pithDescription, methodDescription, mangioCrepeHopDescription, featureRatioDescription, protectVoicelessDescription].join("\n\n");

  const settingsKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback(`Pith: ${session.pith}`, "set_pith"), Markup.button.callback(`Method: ${session.method}`, "set_method")],
    [Markup.button.callback(`Mangio-Crepe Hop: ${session.mangioCrepeHop}`, "set_mangio_crepe_hop"), Markup.button.callback(`Feature Ratio: ${session.featureRatio}`, "set_feature_ratio")],
    [Markup.button.callback(`Protect Voiceless: ${session.protectVoiceless}`, "set_protect_voiceless"), Markup.button.callback(`Изменить персонажа`, "characters")],
    [Markup.button.callback("Меню", "menu")],
  ]).resize();

  await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
}