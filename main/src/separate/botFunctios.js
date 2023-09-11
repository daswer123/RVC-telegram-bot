import { Markup } from "telegraf";
import { checkForLimits, createSessionFolder } from "../botFunction.js";
import { separateAudioMaxQueue } from "../variables.js";
import axios from "axios";
import path from "path"
import fs from 'fs';
import fspr from "fs/promises"
import { compressMp3, compressMp3Same, downloadFile, logUserSession } from "../functions.js";

export async function separateAudioBot(ctx, sessionPath, isAudio = false) {
    try {

        if (checkForLimits(ctx, "separateAudio", separateAudioMaxQueue)) return

        const prevState = ctx.session.audioProcessPower
        ctx.session.audioProcessPower = "both"

        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        if (!isAudio) {
            const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
            await downloadFile(link, `${sessionPath}/audio.wav`);
        }

        await ctx.reply("Ваш запрос на разделение аудио был добавлен в очередь, ожидайте.\nТекущую очередь вы можете увидеть по команде /pos")

        const response = await axios.post('http://localhost:8080/separateAudio', {
            session: ctx.session,
            sessionPath: sessionPath,
            isAudio: isAudio,
            userId: ctx.from.id
        });

        const { vocalPath, instrumentalPath, vocalPathDeEcho, vocalString } = response.data;

        await ctx.reply(vocalString)
        await ctx.sendAudio({ source: vocalPath });

        if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "echo" || ctx.session.audioProcessPower === "both") {
            await ctx.sendAudio({ source: vocalPathDeEcho });

            const sourcePath = `${sessionPath}/out_back/instrument_vocal_de_echo.mp3_10.wav`;
            const destinationPath = `${sessionPath}/backvocal.mp3`;
            const readyDestPath = `${sessionPath}/backvocall.mp3`

            fs.rename(sourcePath, destinationPath, async function (err) {
                if (err) {
                    console.log('ERROR: ' + err);
                }
                else {
                    await ctx.reply("Отдельно бек вокал")
                    await compressMp3(destinationPath, `${sessionPath}/backvocall.mp3`)
                    await ctx.sendAudio({ source: readyDestPath });
                }
            });
        }

        await ctx.reply("Инструментал")
        await ctx.sendAudio({ source: instrumentalPath });

        await logUserSession(ctx, "Separate_Audio")


        ctx.session.audioProcessPower = prevState
    } catch (err) {
        console.log(err)
        ctx.reply("Произошла ошибка, попробуйте снова. Возможно файл который вы загрузили слишком большой. Должен быть не более 19мб.")
    }
}

export function renameDemucsFiles(sessionPath) {
    const vocalsPath = path.join(sessionPath, 'vocals.mp3');
    const noVocalsPath = path.join(sessionPath, 'no_vocals.mp3');

    fs.rename(vocalsPath, path.join(sessionPath, 'vocal.mp3'), function (err) {
        if (err) console.log('ERROR: ' + err);
    });

    fs.rename(noVocalsPath, path.join(sessionPath, 'instrumental.mp3'), function (err) {
        if (err) console.log('ERROR: ' + err);
    });
}

export async function separateAudioBotv2(ctx, filename = "audio.wav", isAudio = false) {
    try {
        if (checkForLimits(ctx, "separateAudio", separateAudioMaxQueue)) return


        const sessionPath = createSessionFolder(ctx)

        if (!isAudio) {
            const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
            await downloadFile(link, `${sessionPath}/audio.wav`);
        }

        await ctx.reply("Ваш запрос на разделение аудио был добавлен в очередь, ожидайте.\nТекущую очередь вы можете увидеть по команде /pos")

        const response = await axios.post('http://localhost:8080/separateAudiov2', {
            sessionPath: sessionPath,
            filename: filename,
            isAudio: isAudio,
            userId: ctx.from.id
        });

        await renameDemucsFiles(sessionPath)

        const vocalPath = `${sessionPath}/vocal.mp3`;
        const instrumentalPath = `${sessionPath}/instrumental.mp3`

        await compressMp3Same(vocalPath, 2)
        await compressMp3Same(instrumentalPath, 2)

        // const { vocalPath, instrumentalPath } = response.data;




        ctx.reply("Вокал и инструментал")
        await ctx.sendAudio({ source: instrumentalPath });
        await ctx.sendAudio({ source: vocalPath });
    } catch (err) {
        console.log(err)
    }
}

export async function separateAudioBotv3(ctx, filename = "audio.wav", isAudio = false) {
    try {
        if (checkForLimits(ctx, "separateAudio", separateAudioMaxQueue)) return


        const sessionPath = createSessionFolder(ctx)

        if (!isAudio) {
            const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
            await downloadFile(link, `${sessionPath}/audio.wav`);
        }

        await ctx.reply("Ваш запрос на разделение аудио был добавлен в очередь, ожидайте.\nТекущую очередь вы можете увидеть по команде /pos")

        const response = await axios.post('http://localhost:8080/separateAudiov3', {
            sessionPath: sessionPath,
            filename: filename,
            isAudio: isAudio,
            userId: ctx.from.id
        });

        await renameDemucsFiles(sessionPath)

        const vocalPath = `${sessionPath}/vocal.mp3`;
        const instrumentalPath = `${sessionPath}/instrumental.mp3`

        await compressMp3Same(vocalPath, 2)
        await compressMp3Same(instrumentalPath, 2)

        // const { vocalPath, instrumentalPath } = response.data;

        ctx.reply("Вокал и инструментал")
        await ctx.sendAudio({ source: instrumentalPath });
        await ctx.sendAudio({ source: vocalPath });
    } catch (err) {
        console.log(err)
    }
}

export async function separateAudioBot6Items(ctx, filename = "audio.wav", isAudio = false) {
    try {
        if (checkForLimits(ctx, "separateAudio", separateAudioMaxQueue)) return


        const sessionPath = createSessionFolder(ctx)

        if (!isAudio) {
            const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
            await downloadFile(link, `${sessionPath}/audio.wav`);
        }

        await ctx.reply("Ваш запрос на разделение аудио был добавлен в очередь, ожидайте.\nТекущую очередь вы можете увидеть по команде /pos")

        const response = await axios.post('http://localhost:8080/separateAudio6Items', {
            sessionPath: sessionPath,
            filename: filename,
            isAudio: isAudio,
            userId: ctx.from.id
        });

        const newPath = path.join(sessionPath, "6s")
        const files = await fspr.readdir(newPath);

        for (let file of files) {
            if (path.extname(file) === '.mp3') { // Сжимаем и отправляем только mp3 файлы
                const filePath = path.join(newPath, file);
                // await compressMp3Same(filePath, 2)
                await ctx.sendAudio({ source: filePath });
            }
        }


        // await renameDemucsFiles(sessionPath)

        // const vocalPath = `${sessionPath}/vocal.mp3`;
        // const instrumentalPath = `${sessionPath}/instrumental.mp3`

        // await compressMp3Same(vocalPath, 2)
        // await compressMp3Same(instrumentalPath, 2)

        // const { vocalPath, instrumentalPath } = response.data;


        ctx.reply("Ваше аудио разделенно на 6 частей", Markup.inlineKeyboard([
            Markup.button.callback('Меню', 'menu')
        ]))

        // ctx.reply("Вокал и инструментал")
        // await ctx.sendAudio({ source: instrumentalPath });
        // await ctx.sendAudio({ source: vocalPath });
    } catch (err) {
        console.log(err)
    }
}

export async function separateAudioBot4Items(ctx, filename = "audio.wav", isAudio = false) {
    try {
        if (checkForLimits(ctx, "separateAudio", separateAudioMaxQueue)) return


        const sessionPath = createSessionFolder(ctx)

        if (!isAudio) {
            const link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
            await downloadFile(link, `${sessionPath}/audio.wav`);
        }

        await ctx.reply("Ваш запрос на разделение аудио был добавлен в очередь, ожидайте.\nТекущую очередь вы можете увидеть по команде /pos")

        const response = await axios.post('http://localhost:8080/separateAudio4Items', {
            sessionPath: sessionPath,
            filename: filename,
            isAudio: isAudio,
            userId: ctx.from.id
        });

        const newPath = path.join(sessionPath, "6s")
        const files = await fspr.readdir(newPath);

        for (let file of files) {
            if (path.extname(file) === '.mp3') { // Сжимаем и отправляем только mp3 файлы
                const filePath = path.join(newPath, file);
                // await compressMp3Same(filePath, 2)
                await ctx.sendAudio({ source: filePath });
            }
        }

        ctx.reply("Ваше аудио разделенно на 4 части", Markup.inlineKeyboard([
            Markup.button.callback('Меню', 'menu')
        ]))

    } catch (err) {
        console.log(err)
    }
}

export async function denoiseAudio(ctx, sessionPath, filename = "audio.wav", isAudio = false) {
    try {
        if (checkForLimits(ctx, "separateAudio", separateAudioMaxQueue)) return
        await ctx.reply("Ваш запрос на разделение аудио был добавлен в очередь, ожидайте.\nТекущую очередь вы можете увидеть по команде /pos")

        const response = await axios.post('http://localhost:8080/denoiseAudio', {
            sessionPath: sessionPath,
            filename: filename,
            isAudio: isAudio,
            userId: ctx.from.id
        });

        // const newPath = path.join(sessionPath, "6s")
        // const files = await fspr.readdir(newPath);

        // for (let file of files) {
        //     if (path.extname(file) === '.mp3') { // Сжимаем и отправляем только mp3 файлы
        //         const filePath = path.join(newPath, file);
        //         // await compressMp3Same(filePath, 2)
        //         await ctx.sendAudio({ source: filePath });
        //     }
        // }


        // await renameDemucsFiles(sessionPath)

        // const vocalPath = `${sessionPath}/vocal.mp3`;
        // const instrumentalPath = `${sessionPath}/instrumental.mp3`

        // await compressMp3Same(vocalPath, 2)
        // await compressMp3Same(instrumentalPath, 2)

        // const { vocalPath, instrumentalPath } = response.data;


        ctx.reply("Ваше аудио разделенно на 6 частей", Markup.inlineKeyboard([
            Markup.button.callback('Меню', 'menu')
        ]))

        // ctx.reply("Вокал и инструментал")
        // await ctx.sendAudio({ source: instrumentalPath });
        // await ctx.sendAudio({ source: vocalPath });
    } catch (err) {
        console.log(err)
    }
}