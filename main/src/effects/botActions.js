import { Markup } from "telegraf";
import { showEffectsSettings } from "../menus/effectsMenu.js";

export function registerEffectBotActions(bot) {
    bot.action("effects_settings", async (ctx) => {

        showEffectsSettings(ctx)

        ctx.session.waitingForCover = false;
        ctx.session.mergeAudio = false;
    })

    bot.action("effect_echo_delay", async (ctx) => {
        ctx.reply("Введите значение для задержи эха\nЗначение по умолчанию: 0.3")

        ctx.session.waitForEchoDelay = true
    })

    bot.action("effect_echo_power", async (ctx) => {
        ctx.reply("Введите значение для громкости эха\nЗначение по умолчанию: 0.1")

        ctx.session.waitForEchoPower = true
    })

    bot.action("effect_reverb", async (ctx) => {
        ctx.reply("Введи силу эффекта реверберации\nЗначение по умолчанию: 0.0005")

        ctx.session.waitForReverb = true
    })

    bot.action("effect_autotune_attack", async (ctx) => {
        ctx.reply("Введите значение для силы воздействия автотюна\nЗначение по умолчанию: 0.1")

        ctx.session.waitForAutotuneAttack = true
    })

    bot.action("effect_autotune_str", async (ctx) => {
        ctx.reply("Введите значение для силы применения автотюна\nЗначение по умолчанию: 0.9")

        ctx.session.waitForAutotuneStr = true
    })

    bot.action("toggle_autotune", async (ctx) => {
        ctx.session.neuroAutoTune = ctx.session.neuroAutoTune ? false : true
        ctx.session.autoTune = false

        ctx.reply(`Автотюн от нейросети успешно ${ctx.session.neuroAutoTune === true ? "Включенн" : "Выключенн"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'menu'),
        ]))
    })



    bot.action("toggle_audio_phoneEffect", async (ctx) => {
        ctx.reply("Эффект телефона успешно включенн")
        ctx.session.phoneEffect = ctx.session.phoneEffect === true ? false : true
        ctx.reply(`Эффект телефона ${ctx.session.phoneEffect === true ? "Включен" : "Выключен"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'aisettings'),
        ]))
    })



    bot.action("toggle_audio_reverb", async (ctx) => {
        ctx.reply("Реверберация успешно включенна")
        ctx.session.reverbOn = ctx.session.reverbOn === true ? false : true
        ctx.reply(`Реверберация успешно ${ctx.session.reverbOn === true ? "Включенна" : "Выключенна"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'aisettings'),
        ]))
    })

    bot.action("toggle_audio_echo", async (ctx) => {
        ctx.session.echoOn = ctx.session.echoOn === true ? false : true
        ctx.reply(`Эхо успешно ${ctx.session.echoOn === true ? "Включенно" : "Выключенно"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'aisettings'),
        ]))
    })

    bot.action("toggle_audio_autotune", async (ctx) => {
        ctx.session.autoTune = ctx.session.autoTune === true ? false : true

        ctx.session.neuroAutoTune = false
        ctx.reply(`Автотюн успешно ${ctx.session.autoTune === true ? "Включенн" : "Выключенн"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'aisettings'),
        ]))
    })



    bot.action("toggle_audio_effects", async (ctx) => {
        ctx.session.improveAudio = ctx.session.improveAudio === true ? false : true
        ctx.reply("Вы переключили эффекты на голос ( эхо, реверб, нормализация ) на " + ctx.session.improveAudio)
    })

}