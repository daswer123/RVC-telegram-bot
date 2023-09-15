import { Markup } from "telegraf";

export async function showSeparateMenu(ctx) {
    try {

        const session = ctx.session;

        const mainDesk = "Это раздел для разделения аудио, на выбор у вас есть 5 варианта\n\nРазделить Аудио v1 - это старый метод который был ранее, работает медленно, но по заявлениям пользователей работает лучше всего\n\nРазделить Аудио v2 - это новый метод который в 5 раз быстрее, по показателям не уступает предыдущему\n\nРазделить Аудио v2.1 улучшенная версия 2, работает дольше чем версия 2\n\nРазделить Аудио v2.1 на 4 части - это разделит ваше аудио на 4 части ( басс, барабаны, остальное и вокал )\n\nРазделить Аудио v2 на 6 частей - это разделит ваше аудио на 6 частей ( басс, барабаны, гитара, пианино ( плохо ), остальное и вокал )\n\nМодификаторы при разделение аудио - направленны на получения более чистого вокала, работают только с версий v1"

        const settingsMessage = [mainDesk].join("\n\n");

        const settingsKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback("Разделить Аудио v2", "separatev2")],
            [Markup.button.callback("Разделить Аудио v2.1", "separatev3")],
            // [Markup.button.callback("Разделить Аудио на 4 части", "separate6items")],
            [Markup.button.callback("Разделить Аудио на 6 частей", "separate6items")],
            [Markup.button.callback("Разделить Аудио на 4 части ( более точное )", "separate4items")],
            // [Markup.button.callback("Удалить шум", "denoise")],
            [Markup.button.callback("Разделить Аудио v1", "separate")],
            [Markup.button.callback("Удалить инструмент из аудио", "separate_inst")],
            [Markup.button.callback("Модификаторы при разделении аудио", "set_audio_process_power")],
            [Markup.button.callback("Меню", "menu")],
        ]).resize();

        await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
    } catch (err) {
        ctx.reply("Непредвиденная ошибка, введите /start")
        console.log(err)
    }

}