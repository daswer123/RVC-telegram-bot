import { Markup } from "telegraf";

export async function showSettings(ctx) {
  
    const session = ctx.session;
  
    const pithDescription = "Pith - вв тона, если выбираешь женскую модель но ты мужчина ставь 12, если наоборот -12, если пол совпадает то 0";
    const methodDescription = "Method - Метод обработки голоса: harvest - лучше выделяет особенности голоса , crepe - более медленный, но лучше обрабатывает голос в целом, mango-crepe - Улучшенный вариант creep с возможностью выбрать Mangio-Crepe Hop";
    const mangioCrepeHopDescription = "Mangio-Crepe Hop - означает время, необходимое говорящему для перехода на резкую высоту тона. При меньшей длине скачка требуется больше времени, чтобы сделать вывод, но он более точен. Оптимальное значение 128";
    const featureRatioDescription = "Feature ratio - На сколько голос будет подкоректирован согласно речевым особенностям модели, может вызвать эффект метала";
    const protectVoicelessDescription = "Protect voiceless - Защита безголосых согласных и звуков дыхания для предотвращения артефактов музыки. Установите значение0,5 для отключения. Уменьшите значение для усиления защиты, но это может снизить точность индексирования";
    const voiceActorDescription = "Модель для голоса - Изначальный голос для преобразования модели из текста в речь"
    const outputType = "Тип ответа - Тип присылаемого аудио в ответ на голосовое, 2 режима - audio и voice"
  
    const autoTuneDesc = `Автотюн, который регулируется нейросетью, конфликтует с автотюном в эффектах, так что может работать только 1` 
    const aboutMinMax = `Min-Max Pitch, определяет допустимый диапазон частоты (pitch), применяемый в методе rmvpe+.\nДопустимые значения в Гц варьируются от 1 до 16000.Также вы можете использовать музыкальные ноты для определения диапазона.Например, 'C0' соответствует частоте примерно 16 Гц, а 'E10' соответствует частоте примерно 15600 Гц.` 
  
    const settingsMessage = [pithDescription, aboutMinMax, methodDescription, mangioCrepeHopDescription, featureRatioDescription, protectVoicelessDescription,autoTuneDesc, voiceActorDescription,outputType].join("\n\n");
  
    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Pith: ${session.pith}`, "set_pith"), Markup.button.callback(`Method: ${session.method}`, "set_method")],
      [Markup.button.callback(`Mangio-Crepe Hop: ${session.mangio_crepe_hop}`, "set_mangio_crepe_hop"), Markup.button.callback(`Feature Ratio: ${session.feature_ratio}`, "set_feature_ratio")],
      [Markup.button.callback(`Protect Voiceless: ${session.protect_voiceless}`, "set_protect_voiceless"),Markup.button.callback(`Изменить скорость речи ${session.voice_speed}`, "set_voice_speed")],
      [Markup.button.callback(`Min Pith: ${session.minPich}`, "set_minPich"),Markup.button.callback(`Max Pith ${session.maxPich}`, "set_maxPich")],
      [Markup.button.callback(`Autotune: ${session.neuroAutoTune}`,"toggle_autotune")],
      [Markup.button.callback(`Изменить текстовую голосовую модель ${session.voiceActor}`, "set_voice")],
      [Markup.button.callback(`Тип ответа на голосовое: ${session.voiceOrAudioOut}`, "set_out_voice")],
      [Markup.button.callback("Меню", "menu")],
    ]).resize();
  
    await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  }