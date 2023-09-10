import { Markup } from "telegraf";

export async function showSeparateMenu(ctx) {
    try {

        const session = ctx.session;

        const mainDesk = "Это раздел для разделения аудио, на выбор у вас есть 4 варианта\n\nРазделить Аудио v1 - это старый метод который был ранее, работает медленно и скоро будует удален\n\nРазделить Аудио v2 - это новый метод который в 5 раз быстрее, по показателям не уступает предыдущему\n\nРазделить Аудио v2 на 6 частей - это разделит ваше аудио на 6 частей\n\nУдалить шумы - вы можете удалить шумы с вашей аудиозаписи"

        const settingsMessage = [mainDesk].join("\n\n");

        const settingsKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback("Разделить Аудио v2", "separatev2")],
            [Markup.button.callback("Разделить Аудио на 6 частей", "separate6items")],
            // [Markup.button.callback("Удалить шум", "denoise")],
            [Markup.button.callback("Разделить Аудио v1 (скоро будет удален)", "separate")],
            [Markup.button.callback("Меню", "menu")],
        ]).resize();

        await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
    } catch (err) {
        ctx.reply("Непредвиденная ошибка, введите /start")
        console.log(err)
    }

}