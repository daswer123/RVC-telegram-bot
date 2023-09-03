import { banUser, unbanUser } from "./botFunctions.js";

export async function adminHandler(ctx) {

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
