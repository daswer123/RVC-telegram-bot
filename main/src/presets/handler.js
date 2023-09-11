import { Markup } from "telegraf";
import { savePresetsToDatabase } from "../server/db.js";

export const handlePresetSave = async (ctx) => { // добавьте async здесь
    ctx.session.waitForPresetSave = false;
    const presetName = ctx.message.text;

    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя

    // Замените сохранение в файл на сохранение в базу данных
    await savePresetsToDatabase(uniqueId, presetName, ctx.session); // и используйте await здесь

    // Ответ пользователю
    ctx.reply(`Пресет "${presetName}" успешно сохранен.`, Markup.inlineKeyboard([
        Markup.button.callback('Меню', 'menu')
    ]));
    return true;
}