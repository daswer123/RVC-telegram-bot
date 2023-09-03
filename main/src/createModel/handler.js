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