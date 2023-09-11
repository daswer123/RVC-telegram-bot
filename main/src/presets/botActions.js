import { Markup } from "telegraf";
import path from "path";
import fs from 'fs'
import { loadSettings } from "./botFunctions.js";
import { deletePresetFromDatabase, getPresetFromDatabase, getPresetsFromDatabase, savePresetsToDatabase } from "../server/db.js";

export function registerPresetBotActions(bot) {
    // Обработчик для кнопки "save_preset"
    bot.action('save_preset', (ctx) => {

        // Перед сохранением пресета, спросим у пользователя имя для пресета
        ctx.reply('Пожалуйста, введите имя для вашего пресета:');
        ctx.session.waitForPresetSave = true
        // Следующее сообщение пользователя будет обработано как имя пресета
        // bot.on('message', handlePresetName);
    });

    // Обработчик для кнопки "load_preset"
    bot.action('load_preset', (ctx) => {

        loadSettings(ctx)
    });


    // Обработчик для кнопок пресетов
    bot.action(/select_preset:(.+)/, (ctx) => {
        try {
            const presetName = ctx.match[1];
            // Ответ пользователю
            ctx.reply(`Пресет "${presetName}" выбран. Хотите загрузить его сейчас?`, Markup.inlineKeyboard([
                [Markup.button.callback('Загрузить пресет', `load_preset:${presetName}`), Markup.button.callback('Удалить пресет', `delete_preset:${presetName}`)],
                [Markup.button.callback('Перезаписать пресет', `overwrite_preset:${presetName}`), Markup.button.callback('Меню', 'menu')],
            ]));
        } catch (err) { ctx.reply("Произошла ошибка") }
    });

    // Обработчик для кнопки "load_preset"
    bot.action(/load_preset:(.+)/, async (ctx) => { // добавьте async здесь
        try {
            const presetName = ctx.match[1];
            const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя

            // Замените чтение из файла на чтение из базы данных
            const presets = await getPresetFromDatabase(uniqueId, presetName); // и используйте await здесь
            console.log(presets)

            if (presets) {
                ctx.session.loadConfig = { ...presets }

                ctx.reply(`Пресет "${presetName}" успешно загружен.`, Markup.inlineKeyboard([
                    Markup.button.callback('Меню', 'menu'),
                ]));
            } else {
                ctx.reply('Выбранный пресет не найден.', Markup.inlineKeyboard([
                    Markup.button.callback('Меню', 'menu')
                ]));
            }
        } catch (err) {
            ctx.reply("Произошла ошибка")
            console.log(err)
        }
    });



    // Обработчик для кнопки "delete_preset"
    bot.action(/delete_preset:(.+)/, async (ctx) => { // добавьте async здесь

        const presetName = ctx.match[1];

        const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя

        const presets = await getPresetsFromDatabase(uniqueId); // Замените чтение из файла на чтение из базы данных

        if (presets.includes(presetName)) {
            // Удаляем пресет из базы данных
            await deletePresetFromDatabase(uniqueId, presetName);

            // Ответ пользователю
            ctx.reply(`Пресет "${presetName}" успешно удален.`, Markup.inlineKeyboard([
                Markup.button.callback('Меню', 'menu')
            ]));
        } else {
            ctx.reply('Выбранный пресет не найден.', Markup.inlineKeyboard([
                Markup.button.callback('Меню', 'menu')
            ]));
        }
    });

    // Обработчик для кнопки "overwrite_preset"
    bot.action(/overwrite_preset:(.+)/, async (ctx) => { // добавьте async здесь

        const presetName = ctx.match[1];

        const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя

        const presets = await getPresetsFromDatabase(uniqueId); // Замените чтение из файла на чтение из базы данных

        if (presets.includes(presetName)) {
            // Перезаписываем пресет текущими настройками пользователя в базе данных
            await savePresetsToDatabase(uniqueId, presetName, ctx.session);

            // Ответ пользователю
            ctx.reply(`Пресет "${presetName}" успешно перезаписан.`, Markup.inlineKeyboard([
                Markup.button.callback('Меню', 'menu')
            ]));
        } else {
            ctx.reply('Выбранный пресет не найден.', Markup.inlineKeyboard([
                Markup.button.callback('Меню', 'menu')
            ]));
        }
    });
}