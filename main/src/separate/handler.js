import { Markup } from "telegraf";
import { is_youtube_url, separateAudioBot } from "../botFunction.js";
import { downloadFromYoutube } from "../functions.js";
import { saveSessionToDatabase } from "../server/db.js";

export async function separateV1Hanlder(ctx) {
    try {
        console.log(ctx.session.waitForSeparate, "sep")
        if (ctx.session.waitForSeparate) {
            if (!is_youtube_url(ctx.message.text)) {
                ctx.reply("Неправильная ссылка на ютуб, введите команду /separate и попробуйте еще раз")
                ctx.session.waitForSeparate = false
                return
            }
            const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
            const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
            const sessionPath = `sessions/${uniqueId}/${messageId}`;

            await downloadFromYoutube(ctx.message.text, sessionPath);

            await separateAudioBot(ctx, sessionPath, true)
            ctx.session.waitForSeparate = false
            return

        }

        return Promise.resolve(false)
    } catch (err) { console.log(err) }
}