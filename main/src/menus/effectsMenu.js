import { Markup } from "telegraf";

export async function showEffectsSettings(ctx){

    const session = ctx.session;
  
    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback("Эхо: Задержка - " + session.echoDelay, "effect_echo_delay"), Markup.button.callback("Эхо: Громкость - "+ session.echoPower, "effect_echo_power")],
      [Markup.button.callback("Реверберация: Сила эффекта - "+session.reverbPower, "effect_reverb")],
      [Markup.button.callback("Автотюн: Воздействие - "+session.autotune_attack, "effect_autotune_attack"), Markup.button.callback("Автотюн: Сила - "+session.autotune_strength, "effect_autotune_str")],
      [Markup.button.callback("Назад", "aisettings")],
    ]).resize();
  
    await ctx.replyWithMarkdown("Меню настройки эффектов", settingsKeyboard);
  }


  