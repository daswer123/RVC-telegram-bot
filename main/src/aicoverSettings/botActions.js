import { Markup } from "telegraf";
import { showAICoverSettings } from "../menus/aicoverMenu.js";

export function registerAiCoverSettingsBotActions(bot) {

    bot.action("aisettings", async (ctx) => {

        await showAICoverSettings(ctx);
    });

    bot.action("set_audio_process_power", async (ctx) => {
        const audioProcessPowerKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback("Nothing", "audio_process_power_nothing"), Markup.button.callback("Echo", "audio_process_power_echo")],
            [Markup.button.callback("Backvocal", "audio_process_power_backvocal"), Markup.button.callback("Both", "audio_process_power_both")],
        ]).resize();
        await ctx.reply(`
    Выберите уровень обработки аудио:\n\nМодификаторы при обработке вокала - есть 3 модификатора, echo - убрать эхо из вокала, backvocal - убрать бэк вокал и both - убрать и то и то\n\nnothing - ничего не делает с отделенным вокалом`
            , audioProcessPowerKeyboard);
    });

    bot.action(/audio_process_power_(nothing|echo|backvocal|both)/, async (ctx) => {
        const audioProcessPowerValue = ctx.match[1];
        ctx.session.audioProcessPower = audioProcessPowerValue;
        await ctx.reply(
            `Audio Process Power установлен на ${audioProcessPowerValue}`,
            Markup.inlineKeyboard([Markup.button.callback("Назад", "aisettings")], {
                columns: 3,
            }).resize()
        );
        await ctx.answerCbQuery();
    });


    bot.action("set_vocal_volume", async (ctx) => {
        ctx.session.settingVocalVolume = true;
        await ctx.reply("Введите громкость вокала для ИИ кавера от 0 до 3, где 1 стандартное значение");
        await ctx.answerCbQuery();

    })

    bot.action("set_instrumental_volume", async (ctx) => {
        ctx.session.settingInstrumentVolume = true;
        await ctx.reply("Введите громкость инструментала для ИИ кавера от 0 до 3, где 1 стандартное значение");
        await ctx.answerCbQuery();
    })

}