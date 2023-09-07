import { countUsersAndModels, createLogMessages, getLogs, getRecentLogs, getUserIds, getUserInfo, sendMessageToUser } from "./botFunctions.js";
import { Markup } from "telegraf";
import { getTrainModelsFromDatabase, removeTrainModelFromDatabase } from "../server/db.js";
import { showAdminMenu } from "../menus/adminMenu.js";

export function registerAdminBotActions(bot) {
    bot.action("admin_ban_user", async (ctx) => {
        ctx.reply("Введите ID или ник пользователя которого нужно забанить")
        ctx.session.waitForBan = true
    })
    bot.action("admin_unban_user", async (ctx) => {
        ctx.reply("Введите ID или ник пользователя которого нужно разбанить")
        ctx.session.waitForUnBan = true
    })

    bot.action("admin_show_stats", async (ctx) => {
        const logs = getLogs();
        const recentLogs = getRecentLogs(logs);
        const [userCounts, modelCounts, someCount] = countUsersAndModels(recentLogs);
        const [userCountsMessage, modelCountsMessage,] = createLogMessages(userCounts, someCount);

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

    bot.action("admin_create_model_notification", async (ctx) => {
        try {
            const entries = await getTrainModelsFromDatabase();

            if (entries.length < 1) {
                ctx.reply("Моделей на создание нет")
                showAdminMenu(ctx)
            }

            for (const entry of entries) {
                const message = `${entry.username || entry.id} - ${entry.modelName} - ${entry.description} - ${entry.date}`;

                const approveButton = Markup.button.callback('Сообщить о готовности', `approve_${entry.id}_${entry.date}`);
                const rejectButton = Markup.button.callback('Отклонить', `reject_${entry.id}_${entry.date}`);

                await ctx.reply(message, Markup.inlineKeyboard([approveButton, rejectButton]));
            }
        } catch (err) {
            ctx.reply("Ошибка при получении моделей из базы данных")
            console.log(err)
        }
    });

    bot.action(/approve_(.+)_((?:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z))/, async (ctx) => {
        const userId = ctx.match[1]; // преобразование в число
        const date = ctx.match[2];
        const entries = await getTrainModelsFromDatabase();

        const userEntry = entries.find(entry => entry.id === userId && entry.date === date);
        console.log(entries, userEntry)
        if (userEntry) {
            const message = `Ваша модель "${userEntry.modelName}" готова!`;
            await sendMessageToUser(userId, message, bot);
            await removeTrainModelFromDatabase(userId, date);
            ctx.reply(`Оповещение пользователю ${userId} отправлено`)
        } else {
            ctx.reply("Ошибка")
        }
    });

    bot.action(/reject_(.+)_((?:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z))/, async (ctx) => {
        const userId = ctx.match[1];
        const date = ctx.match[2];
        const entries = await getTrainModelsFromDatabase();
        const userEntry = entries.find(entry => entry.id === userId && entry.date === date);

        if (userEntry) {
            const message = `Ваша модель "${userEntry.modelName}" была отклонена. Возможно ваши образцы были плохого качества или слишком короткими.`;
            await sendMessageToUser(userId, message, bot);
            await removeTrainModelFromDatabase(userId, date);
            ctx.reply(`Оповещение пользователю ${userId} отправлено`)
        } else {
            ctx.reply("Ошибка")
        }
    });




    bot.action("admin_make_privat_model", async (ctx) => {
        ctx.session.waitForPrivatModel = true
        ctx.reply("Введите данные в формате:\nID;Название Пресета;путь к модели;Путь к индексу;имя модели")
    })
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

    bot.action("admin_give_admin", async (ctx) => {
        ctx.session.waitForAdminGive = true
        ctx.reply("Введите ник пользователя или ID что бы дать Админ доступ")
    })


}

