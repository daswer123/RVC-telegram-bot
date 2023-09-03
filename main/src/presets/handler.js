import path from "path"
import fs from "fs"
import { Markup } from "telegraf";

export const handlePresetSave = (ctx) => {
    ctx.session.waitForPresetSave = false;
    const presetName = ctx.message.text;

    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
    const sessionPath = path.join('sessions', String(uniqueId));
    const presetsFilePath = path.join(sessionPath, 'presets.json');

    // Создаем папку для пользователя, если она еще не существует
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    let presets = {};
    // Если файл presets.json уже существует, прочитаем его
    if (fs.existsSync(presetsFilePath)) {
        const presetsFileContent = fs.readFileSync(presetsFilePath);
        presets = JSON.parse(presetsFileContent);
    }

    // Добавляем новый пресет
    presets[presetName] = ctx.session;

    // Сохраняем обновленные пресеты обратно в файл
    fs.writeFileSync(presetsFilePath, JSON.stringify(presets));

    // Ответ пользователю
    ctx.reply(`Пресет "${presetName}" успешно сохранен.`, Markup.inlineKeyboard([
        Markup.button.callback('Меню', 'menu')
    ]));
    return true;
}