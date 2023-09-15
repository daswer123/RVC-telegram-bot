import { showSeparateMenu } from "../menus/separateMenu.js";
import { Markup } from "telegraf";

export function registerSeparateBotActions(bot) {

    bot.action("separate", async (ctx) => {
        try {
            // Перед сохранением пресета, спросим у пользователя имя для пресета
            ctx.reply('Дополнительные настройки вы можете найти во вкладке, настройки AI кавера\n\nКиньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
            ctx.session.waitForSeparate = true
        } catch (e) { console.log(e) }
    })

    bot.action("separatev2", async (ctx) => {
        try {
            // Перед сохранением пресета, спросим у пользователя имя для пресета
            ctx.reply('Киньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
            ctx.session.waitForSeparatev2 = true
        } catch (e) { console.log(e) }
    })

    bot.action("separatev3", async (ctx) => {
        try {
            // Перед сохранением пресета, спросим у пользователя имя для пресета
            ctx.reply('Киньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
            ctx.session.waitForSeparatev3 = true
        } catch (e) { console.log(e) }
    })

    bot.action("separate6items", async (ctx) => {
        try {
            // Перед сохранением пресета, спросим у пользователя имя для пресета
            ctx.reply('Киньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
            ctx.session.waitForSeparate6Items = true
        } catch (e) { console.log(e) }
    })

    bot.action("separate4items", async (ctx) => {
        try {
            // Перед сохранением пресета, спросим у пользователя имя для пресета
            ctx.reply('Киньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
            ctx.session.waitForSeparate4Items = true
        } catch (e) { console.log(e) }
    })

    bot.action("separate_inst", async (ctx) => {
        const instrumentKeyboard = Markup.inlineKeyboard([
            Markup.button.callback("Piano", "inst_piano"),
            Markup.button.callback("Guitar", "inst_guitar"),
            Markup.button.callback("Bass", "inst_bass"),
            Markup.button.callback("Drums", "inst_drums"),
            Markup.button.callback("Other", "inst_other"),
            Markup.button.callback("Назад", "separate_menu"),
        ]).resize();
        await ctx.reply("Выберете инструмент который нужно удалить:\n\nPiano, Guitar, Other - обрабатываются моделью, которая разделяет аудио на 6\n\nBass, Drums - обрабатывается моделью 2.1, более точная чем предыдущая\n\nКачество Piano и Guitar может быть хуже чем качество других инструментов\n\nНа выходе вы получите готовое аудио с удаленным инструментом", instrumentKeyboard);
    });


    bot.action(/inst_(piano|guitar|bass|drums|other)/, async (ctx) => {
        let instrumentValue = ctx.match[1];

        await ctx.reply(`Выбранный инструмент: ${instrumentValue}`)
        await ctx.reply('Киньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');

        ctx.session.removeInstrument = instrumentValue;
        ctx.session.waitForSeparateInst = true
    });

    // bot.action("denoise", async (ctx) => {
    //     try {
    //         // Перед сохранением пресета, спросим у пользователя имя для пресета
    //         ctx.reply('Запишите голосовое или скиньте аудиозапись что бы удалить шумы.');
    //         ctx.session.waitForDenoise = true
    //     } catch (e) { console.log(e) }
    // })


    bot.action("separate_menu", async (ctx) => {
        showSeparateMenu(ctx)
    })
}