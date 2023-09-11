import { banUser, getUserByUsernameFromDatabase, getUserFromDatabase, unbanUser, updatePresetInDatabase, updateUserStatusInDatabase } from "../server/db.js";
import { sendMessageToAllUsers } from "./botFunctions.js";
import { showAdminMenu } from "./menu.js";

export async function adminHandler(ctx, bot) {

    if (ctx.session.waitForBan) {
        const uniqueId = ctx.message.text; // получаем уникальный идентификатор пользователя
        banUser(uniqueId)
        ctx.reply("Пользователь успешно забанен")
        ctx.session.waitForBan = false
        return
    }

    if (ctx.session.waitForUnBan) {
        const uniqueId = ctx.message.text; // получаем уникальный идентификатор пользователя
        unbanUser(uniqueId)
        ctx.reply("Пользователь успешно забанен")
        ctx.session.waitForUnBan = false
        return
    }

    // Дать админ права
    if (ctx.session.waitForAdminGive) {
        const uniqueIdOrUsername = ctx.message.text; // Получаем уникальный идентификатор пользователя или его имя

        // Попытка найти пользователя по ID
        let user = await getUserFromDatabase(uniqueIdOrUsername);

        // Если пользователь не найден по ID, попробуем найти по имени пользователя
        if (!user) {
            user = await getUserByUsernameFromDatabase(uniqueIdOrUsername);
        }

        // Если пользователь найден, обновляем его статус на 'admin'
        if (user) {
            await updateUserStatusInDatabase(user.userId, 'admin');
            ctx.reply("Пользователь успешно стал администратором");
        } else {
            ctx.reply("Пользователь не найден");
        }

        ctx.session.waitForAdminGive = false;
        return;
    }

    if (ctx.session.waitForPrivatModel) {
        ctx.session.waitForPrivatModel = false
        const [id, presetName, model_path, index_path, name] = ctx.message.text.split(";")

        updatePresetInDatabase(id, presetName, model_path, index_path, name)
        ctx.reply("Успех, приватная модель установленна")
        showAdminMenu(ctx)
        return
    }


    if (ctx.session.waitForControlPower) {
        ctx.session.waitForControlPower = false
        const [transform, silero, separate] = ctx.message.text.split(",")

        updateNumbersInJson(transform, silero, separate)
        ctx.reply("Данные успешно обновленны")
        return
    }

    if (ctx.session.waitForAnonceAll) {
        ctx.session.waitForAnonceAll = false
        sendMessageToAllUsers(ctx.message.text, bot)
        return
    }

    if (ctx.session.waitForAnonceCurrent) {
        ctx.session.waitForAnonceCurrent = false

        const [id, message] = ctx.message.text.split(",")
        sendMessageToUser(id, message, bot)
        return
    }

    return Promise.resolve(false)
}
