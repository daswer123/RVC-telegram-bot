import { countUsersAndModels, createLogMessages, getLogs, getRecentLogs, getUserIds, getUserInfo } from "./botFunctions.js";
import fs from 'fs'

export function registerAdminBotActions(bot) {
    bot.action("admin_ban_user", async (ctx) => {
        ctx.reply("Введите ID пользователя которого нужно забанить")
        ctx.session.waitForBan = true
    })
    bot.action("admin_unban_user", async (ctx) => {
        ctx.reply("Введите ID пользователя которого нужно разбанить")
        ctx.session.waitForUnBan = true
    })

    bot.action("admin_show_stats", async (ctx) => {
        const logs = getLogs();
        const recentLogs = getRecentLogs(logs);
        const [userCounts, modelCounts] = countUsersAndModels(recentLogs);
        const [userCountsMessage, modelCountsMessage] = createLogMessages(userCounts, modelCounts);

        // Проверка на длину сообщения и разбиение на несколько сообщений, если это необходимо
        if (userCountsMessage.length > 4096) {
            let messages = userCountsMessage.match(/.{1,4096}/g);
            messages.forEach(msg => ctx.replyWithMarkdown(msg));
        } else {
            ctx.replyWithMarkdown(userCountsMessage);
        }

        if (modelCountsMessage.length > 4096) {
            let messages = modelCountsMessage.match(/.{1,4096}/g);
            messages.forEach(msg => ctx.replyWithMarkdown(msg));
        } else {
            ctx.replyWithMarkdown(modelCountsMessage);
        }
    });

    bot.action("admin_clear_folder", async (ctx) => {
        const userIds = getUserIds();
        userIds.forEach(clearFolder);
    });
    
    bot.action("get_all_user_id", async (ctx) => {
        const userIds = getUserIds();
        let message = '';
        for (const userId of userIds) {
            message += await getUserInfo(ctx, userId);
        }
        try {
            await ctx.replyWithMarkdown(message);
        } catch (error) {
            console.error('Не удалось отправить сообщение:', error);
        }
    });
    


    bot.action("admin_control_power", async (ctx) => {
        ctx.session.waitForControlPower = true
        ctx.reply("Введите 3 числа через запятую, эти числа значат нагрузку на:\n1)Преобразование\n2)TTS\n3)Разделение аудио\nПример: 1,1,1")
    })

    bot.action("admin_send_msg_all", async (ctx) => {
        ctx.session.waitForAnonceAll = true
        ctx.reply("Введите сообщение которое получат все пользователи")
    })

    bot.action("admin_send_msg_сurrent", async (ctx) => {
        ctx.session.waitForAnonceCurrent = true
        ctx.reply("Введите сообщение которое получат все пользователи\nВведите в формате 'id,message' ")
    })

}

