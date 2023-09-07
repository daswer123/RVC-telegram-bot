import { Markup } from "telegraf";
import fs from "fs";
import path from "path";

export const loadSettings = async (ctx) => {
    try {
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
    } catch (err) {
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

