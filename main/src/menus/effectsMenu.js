import { Markup } from "telegraf";

export async function showEffectsSettings(ctx) {

  const session = ctx.session;

  const mainDesk = "Меню настройки эффектов, эффекты применяются к голосовым сообщениям и к AI каверам"
  const echoDesc = `Добавить эхо, сейчас оно - ${ctx.session.echoOn === true ? "Включенно" : "Выключенно"}`
  const reverbDesc = `Добавить реверберацию, сейчас она - ${ctx.session.reverbOn === true ? "Включенна" : "Выключенна"}`
  const autoTuneDesc = `Добавить автотюн, сейчас он - ${ctx.session.autoTune === true ? "Включенн" : "Выключенн"}`

  const settingsMessage = [mainDesk, reverbDesc, echoDesc, autoTuneDesc].join("\n\n");

  const settingsKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback("Включить реверберацию", "toggle_audio_reverb"), Markup.button.callback("Включить эхо", "toggle_audio_echo")],
    [Markup.button.callback("Включить автотюн", "toggle_audio_autotune"), Markup.button.callback("Включить эффект телефона", "toggle_audio_phoneEffect")],
    [Markup.button.callback("Эхо: Задержка - " + session.echoDelay, "effect_echo_delay"), Markup.button.callback("Эхо: Громкость - " + session.echoPower, "effect_echo_power")],
    [Markup.button.callback("Реверберация: Сила эффекта - " + session.reverbPower, "effect_reverb")],
    [Markup.button.callback("Автотюн: Воздействие - " + session.autotune_attack, "effect_autotune_attack"), Markup.button.callback("Автотюн: Сила - " + session.autotune_strength, "effect_autotune_str")],
    [Markup.button.callback("Назад", "menu")],
  ]).resize();

  await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
}


