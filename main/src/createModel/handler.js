import { Markup } from "telegraf";

export async function createModelHanlder(ctx) {
    try {

        if (ctx.session.waitForModelName) {
            ctx.session.voiceModelName = ctx.message.text
            await ctx.reply("Ваша модель была названа: " + ctx.session.voiceModelName)
            await ctx.reply("Теперь вам нужно ввести краткое описание модели")

            ctx.session.waitForModelName = false
            ctx.session.waitForModelDesc = true
            return
        }

        if (ctx.session.waitForModelDesc) {
            ctx.session.voiceModelDesc = ctx.message.text
            await ctx.reply("Описание для вашей модели было записанно")
            await ctx.reply("Введите пол модели, обязательно вводите по шаблону\nmale\nfemale\nchild")

            ctx.session.waitForModelDesc = false
            ctx.session.waitForModelGender = true
            return
        }

        if (ctx.session.waitForModelGender) {
            ctx.session.voiceModelGender = ctx.message.text
            await ctx.reply("Пол для вашей модели был записан")

            ctx.session.waitForModelGender = false
            await ctx.reply("Инициализация модели прошла успешно, вы можете добавлять образцы голоса", Markup.inlineKeyboard([
                Markup.button.callback('Меню', 'show_create_voice_menu')
            ]))
            return
        }

        return Promise.resolve(false)
    } catch (err) {
        console.log(err)
    }
}


export async function handleMissingModel(ctx) {
    if (!ctx.session.voiceModelName) {
        await ctx.reply("Перед заканчивать создание, вы должны инициализировать модель", Markup.inlineKeyboard([
            Markup.button.callback('Инициализировать модель', 'create_voice_name')
        ]))
        return false
    }
    return true
}

export async function handleCreateModelVoice(ctx) {
    if (ctx.session.waitForVoice) {
        const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
        const folderName = ctx.session.voiceModelName
        let voicePath = `train_voice/${uniqueId}/${folderName}`;

        // создаем папку сессии, если она еще не существует
        if (!fs.existsSync(voicePath)) {
            fs.mkdirSync(voicePath, { recursive: true });
        }

        const date = new Date();
        const timestamp = date.toISOString().replace(/[:.]/g, '-');

        let link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        if (!link) {
            link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
        }

        await downloadFile(link, `${voicePath}/${timestamp}-audio.mp3`);
        ctx.reply("Ваш образец был добавлен в часть вашего набора данных", Markup.inlineKeyboard([
            [
                Markup.button.callback('Добавить ещё', 'create_voice_add_sample'),
                Markup.button.callback('Получить текст', 'create_voice_random_text')
            ],
            [
                Markup.button.callback('Меню', 'show_create_voice_menu')
            ]
        ]))
        ctx.session.waitForVoice = false;
        return
    }
}
