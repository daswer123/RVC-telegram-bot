import { Markup } from "telegraf";
import fs from "fs"

export const showMenu = async (ctx) => {
    const message = `*Меню*\n\n\Ваш текущий персонаж: *${ctx.session.name}*\n\Пресет голоса: *${ctx.session.voice_preset}*\nPich: ${ctx.session.pith}\nВы можете сделать предложение по улучшению функционала бота, для этого выберите специальный пункт в меню\n\nВы можете прислать текст и он будет озвучен голосом персонажа ( голос будет роботизированным )\n\nОтправьте голосовое или перешлите уже сделанное, так же вы можете кинуть аудиофайл\n\nВы можете узнать текущую позицию в очереди через команду /pos`;

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(`Выбрать персонажа`, "characters"), Markup.button.callback(`Показать текущие настройки`, "current_settings")],
        [Markup.button.callback(`Сделать AI кавер`, "cover"), Markup.button.callback(`Разделить аудио`, "separate")],
        [Markup.button.callback("Настройки голоса", "settings"), Markup.button.callback(`Настройка AI Кавера`, "aisettings")],
        [Markup.button.callback("Добавить эффекты к голосу", "effects_settings")],
        [Markup.button.callback("Меню создания голосовых моделей", "show_create_voice_menu")],
        [Markup.button.callback(`Сохранить настройки`, "save_preset"), Markup.button.callback(`Загрузить настройки`, "load_preset")],
        [Markup.button.callback(`Предложения по улучшению бота`, "make_predlog"), Markup.button.callback(`Поддержать автора`, "support")],
    ]).resize();

    await ctx.replyWithMarkdown(message, keyboard);
    return message
};


export const showMenuBtn = async (ctx) => {
    const keyboard = Markup.inlineKeyboard([
        Markup.button.callback("Меню", "menu"),
    ]).resize();

    const message = await ctx.reply('...', keyboard);
    await ctx.replyWithMarkdown("ㅤ", keyboard);
};


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
};