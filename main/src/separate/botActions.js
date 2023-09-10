import { showSeparateMenu } from "../menus/separateMenu.js";

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

    bot.action("separate6items", async (ctx) => {
        try {
            // Перед сохранением пресета, спросим у пользователя имя для пресета
            ctx.reply('Киньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
            ctx.session.waitForSeparate6Items = true
        } catch (e) { console.log(e) }
    })

    bot.action("denoise", async (ctx) => {
        try {
            // Перед сохранением пресета, спросим у пользователя имя для пресета
            ctx.reply('Запишите голосовое или скиньте аудиозапись что бы удалить шумы.');
            ctx.session.waitForDenoise = true
        } catch (e) { console.log(e) }
    })


    bot.action("separate_menu", async (ctx) => {
        showSeparateMenu(ctx)
    })
}