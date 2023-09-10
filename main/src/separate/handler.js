import { Markup } from "telegraf";
import { createSessionFolder, is_youtube_url } from "../botFunction.js";
import { downloadFile, downloadFromYoutube } from "../functions.js";
import { saveSessionToDatabase } from "../server/db.js";
import { denoiseAudio, separateAudioBot, separateAudioBot6Items, separateAudioBotv2 } from "./botFunctios.js";

export async function separateV1Hanlder(ctx) {
    try {
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


export async function separateV2Hanlder(ctx) {
    try {
        if (ctx.session.waitForSeparatev2) {
            if (!is_youtube_url(ctx.message.text)) {
                ctx.reply("Неправильная ссылка на ютуб, введите команду /separate и попробуйте еще раз")
                ctx.session.waitForSeparatev2 = false
                return
            }
            const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
            const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
            const sessionPath = `sessions/${uniqueId}/${messageId}`;

            await downloadFromYoutube(ctx.message.text, sessionPath);

            await separateAudioBotv2(ctx, "audio.wav", true)
            ctx.session.waitForSeparatev2 = false
            return

        }

        return Promise.resolve(false)
    } catch (err) { console.log(err) }
}

export async function separate6ItemsHanlder(ctx) {
    try {
        if (ctx.session.waitForSeparate6Items) {
            if (!is_youtube_url(ctx.message.text)) {
                ctx.reply("Неправильная ссылка на ютуб, введите команду /separate и попробуйте еще раз")
                ctx.session.waitForSeparate6Items = false
                return
            }
            const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
            const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
            const sessionPath = `sessions/${uniqueId}/${messageId}`;

            await downloadFromYoutube(ctx.message.text, sessionPath);

            await separateAudioBot6Items(ctx, "audio.wav", true)
            ctx.session.waitForSeparate6Items = false
            return

        }

        return Promise.resolve(false)
    } catch (err) { console.log(err) }
}

export async function denoiseHanlder(ctx) {
    try {
        // if (ctx.session.waitForDenoise) {

        const sessionPath = createSessionFolder(ctx)

        let link
        if (ctx.message.audio.file_id) {
            link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
        } else {
            link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        }

        await downloadFile(link, `${sessionPath}/audio.wav`);

        await denoiseAudio(ctx, sessionPath, "audio.wav", true)
        ctx.session.waitForDenoise = false
        return

        // }

        // return Promise.resolve(false)
    } catch (err) { console.log(err); ctx.session.waitForDenoise = false }
}