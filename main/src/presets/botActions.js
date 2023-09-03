import { Markup } from "telegraf";
import path from "path";
import fs from 'fs'
import { loadSettings } from "./botFunctions.js";

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
    bot.action(/load_preset:(.+)/, (ctx) => {
        try {
            const presetName = ctx.match[1];

            const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
            const sessionPath = path.join('sessions', String(uniqueId));
            const presetsFilePath = path.join(sessionPath, 'presets.json');

            if (fs.existsSync(presetsFilePath)) {
                const presetsFileContent = fs.readFileSync(presetsFilePath);
                const presets = JSON.parse(presetsFileContent);

                if (presets[presetName]) {
                    // Загружаем пресет в текущую сессию
                    // ctx.session = presets[presetName];
                    ctx.session.loadConfig = { ...presets[presetName] }

                    // Ответ пользователю
                    ctx.reply(`Пресет "${presetName}" успешно загружен.`, Markup.inlineKeyboard([
                        Markup.button.callback('Меню', 'menu'),
                    ]));
                } else {
                    ctx.reply('Выбранный пресет не найден.', Markup.inlineKeyboard([
                        Markup.button.callback('Меню', 'menu')
                    ]));
                }
            } else {
                ctx.reply('У вас нет сохраненных пресетов.', Markup.inlineKeyboard([
                    Markup.button.callback('Меню', 'menu')
                ]));
            }
        } catch (err) {
            ctx.reply("Произошла ошибка")
        }
    });



    // Обработчик для кнопки "delete_preset"
    bot.action(/delete_preset:(.+)/, (ctx) => {

        const presetName = ctx.match[1];

        const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
        const sessionPath = path.join('sessions', String(uniqueId));
        const presetsFilePath = path.join(sessionPath, 'presets.json');

        if (fs.existsSync(presetsFilePath)) {
            const presetsFileContent = fs.readFileSync(presetsFilePath);
            const presets = JSON.parse(presetsFileContent);

            if (presets[presetName]) {
                // Удаляем пресет
                delete presets[presetName];

                // Сохраняем обновленные пресеты обратно в файл
                fs.writeFileSync(presetsFilePath, JSON.stringify(presets));

                // Ответ пользователю
                ctx.reply(`Пресет "${presetName}" успешно удален.`, Markup.inlineKeyboard([
                    Markup.button.callback('Меню', 'menu')
                ]));
            } else {
                ctx.reply('Выбранный пресет не найден.', Markup.inlineKeyboard([
                    Markup.button.callback('Меню', 'menu')
                ]));
            }
        } else {
            ctx.reply('У вас нет сохраненных пресетов.', Markup.inlineKeyboard([
                Markup.button.callback('Меню', 'menu')
            ]));
        }
    });

    // Обработчик для кнопки "overwrite_preset"
    bot.action(/overwrite_preset:(.+)/, (ctx) => {
        // 
        const presetName = ctx.match[1];

        const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
        const sessionPath = path.join('sessions', String(uniqueId));
        const presetsFilePath = path.join(sessionPath, 'presets.json');

        if (fs.existsSync(presetsFilePath)) {
            const presetsFileContent = fs.readFileSync(presetsFilePath);
            const presets = JSON.parse(presetsFileContent);

            if (presets[presetName]) {
                // Перезаписываем пресет текущими настройками пользователя
                presets[presetName] = ctx.session;

                // Сохраняем обновленные пресеты обратно в файл
                fs.writeFileSync(presetsFilePath, JSON.stringify(presets));

                // Ответ пользователю
                ctx.reply(`Пресет "${presetName}" успешно перезаписан.`, Markup.inlineKeyboard([
                    Markup.button.callback('Меню', 'menu')
                ]));
            } else {
                ctx.reply('Выбранный пресет не найден.', Markup.inlineKeyboard([
                    Markup.button.callback('Меню', 'menu')
                ]));
            }
        } else {
            ctx.reply('У вас нет сохраненных пресетов.', Markup.inlineKeyboard([
                Markup.button.callback('Меню', 'menu')
            ]));
        }
    });
}