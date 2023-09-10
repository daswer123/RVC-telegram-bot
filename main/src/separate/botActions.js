import { showSeparateMenu } from "../menus/separateMenu.js";

export function registerSeparateBotActions(bot) {

    bot.action("separate", async (ctx) => {
        try {
            // Перед сохранением пресета, спросим у пользователя имя для пресета
            ctx.reply('Дополнительные настройки вы можете найти во вкладке, настройки AI кавера\n\nКиньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
            ctx.session.waitForSeparate = true

            console.log(ctx.session.waitForSeparate)
        } catch (e) { console.log(e) }
    })


    bot.action("separate_menu", async (ctx) => {
        showSeparateMenu(ctx)
    })
}