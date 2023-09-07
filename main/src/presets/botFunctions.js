import { Markup } from "telegraf";
import fs from "fs";
import path from "path";
import { deletePresetFromDatabase, getPresetsFromDatabase } from "../server/db.js";

export const loadSettings = async (ctx) => {
    try {
        const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя

        // Замените чтение из файла на чтение из базы данных
        const presets = await getPresetsFromDatabase(uniqueId);

        // Если в базе данных нет пресетов, сообщим об этом пользователю
        if (!presets || presets.length === 0) {
            ctx.reply('На данный момент у вас нет сохраненных пресетов.', Markup.inlineKeyboard([
                Markup.button.callback('Меню', 'menu')
            ]));
        } else {
            // Создаем кнопки для каждого пресета
            const buttons = presets.map(presetName => {
                return Markup.button.callback(presetName, `select_preset:${presetName}`);
            });

            // Добавляем кнопку "Меню"
            buttons.push(Markup.button.callback('Меню', 'menu'));

            // Отправляем пользователю меню с пресетами
            ctx.reply('Выберите пресет для загрузки:', Markup.inlineKeyboard(buttons, { columns: 2 }).resize());
        }
    } catch (err) {
        console.log(err)
        ctx.reply("Произошла ошибка, пресеты были удалены")

        const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя

        // Замените удаление файла на удаление пресетов из базы данных
        await deletePresetFromDatabase(uniqueId);
        if (err) {
            console.error(`Ошибка при удалении пресетов: ${err}`);
        }
    }
}

