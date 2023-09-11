import { Markup } from "telegraf";

export async function showAICoverSettings(ctx) {
  try {

    const session = ctx.session;

    const mainDesk = "Тут вы увидете настройки которые нужны для создания ИИ кавера и разделения аудио на вокал и инструментал по команде /separate"
    const vocalVolumeDescription = "Громкость вокала - Уровень громкости вокала может быть от 0 до 3";
    const instrumentalVolumeDescription = "Громкость инструментала - Уровень громкости инструментала может быть от 0 до 3";
    const audioProcessPowerDescription = "Модификаторы при обработке вокала - есть 3 модификатора, echo - убрать эхо из вокала, backvocal - убрать бэк вокал и both - убрать и то и то\nКаждый модификатор добавляет примерно по дополнительной минуте"
    const echoDesc = `Добавить эхо, сейчас оно - ${ctx.session.echoOn === true ? "Включенно" : "Выключенно"}`
    const reverbDesc = `Добавить реверберацию, сейчас она - ${ctx.session.reverbOn === true ? "Включенна" : "Выключенна"}`
    const autoTuneDesc = `Добавить автотюн, сейчас он - ${ctx.session.autoTune === true ? "Включенн" : "Выключенн"}`

    const settingsMessage = [mainDesk, vocalVolumeDescription, instrumentalVolumeDescription, audioProcessPowerDescription, reverbDesc, echoDesc, autoTuneDesc].join("\n\n");

    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Громкость вокала: ${session.voice_volume}`, "set_vocal_volume")],
      [Markup.button.callback(`Громкость инструментала: ${session.instrumnet_volume}`, "set_instrumental_volume")],
      [Markup.button.callback("Меню", "menu")],
    ]).resize();

    await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  } catch (err) {
    ctx.reply("Непредвиденная ошибка, введите /start")
    console.log(err)
  }

}