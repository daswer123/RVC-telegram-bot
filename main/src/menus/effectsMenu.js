import { Markup } from "telegraf";

export async function showEffectsSettings(ctx) {
  try {
    const session = ctx.session;

    // Эффекты и их статусы
    const effectsStatus = {
      "Предварительная обработка": {
        "LowPass filter": session.lowPassOn ? "Включен" : "Выключен",
        "HighPass filter": session.highPassOn ? "Включен" : "Выключен",
        "Compress": session.compressorOn ? "Включен" : "Выключен",
        "NoiseGate": session.noiseGateOn ? "Включен" : "Выключен",
      },
      "Постобработка": {
        "Delay": session.delayOn ? "Включен" : "Выключен",
        "Chorus": session.chorusOn ? "Включен" : "Выключен",
        "Reverb": session.reverbOn ? "Включен" : "Выключен",
        "Compress": session.compressorOn ? "Включен" : "Выключен",
      },
      "Дополнительные эффекты": {
        "Автотюн": session.autoTune ? "Включен" : "Выключен",
        "PitchShift": session.pitchShiftOn ? "Включен" : "Выключен",
        // "Эффект телефонного звонка": session.phoneEffect ? "Включен" : "Выключен",
      },
    }

    let effectsStatusMessage = "";

    for (let [category, effects] of Object.entries(effectsStatus)) {
      effectsStatusMessage += `**${category}**:\n`;
      for (let [effect, status] of Object.entries(effects)) {
        effectsStatusMessage += `- ${effect}: ${status}\n`;
      }
      effectsStatusMessage += "\n";
    }

    const mainDesc = "Меню настройки эффектов, эффекты применяются к голосовым сообщениям и к AI каверам.\n\nЭффекты могут заглушить аудио\n\n" + effectsStatusMessage;

    const settingsMessage = [mainDesc].join("\n\n");

    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback("Эффекты предварительной обработки", "show_preprocess_effects")],
      [Markup.button.callback("Эффекты постобработки", "show_postprocess_effects")],
      [Markup.button.callback("Дополнительные эффекты", "show_other_effects")],
      [Markup.button.callback("Настройка Эффектов для предварительной обработки", "show_preprocess_settigns")],
      [Markup.button.callback("Настройка Эффектов для постобработки", "show_postprocess_settings")],
      [Markup.button.callback("Настройка дополнительных Эффектов", "show_other_effects_settings")],
      [Markup.button.callback("Назад", "menu")],
    ]).resize();

    await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  } catch (err) {
    ctx.reply("Непредвиденная ошибка, введите /start")
    console.log(err)
  }
}


export async function showPreProcessEffets(ctx) {
  try {
    const mainDesk = "Эффекты предварительной обработки применяются к голосовым сообщениям и AI каверам перед преобразованием голоса и могут улучшить качество итогового звука. Настройте эти эффекты под свой вкус."
    const noiseGateDesc = `Noise Gate (Шумозаглушитель) - ${ctx.session.noiseGateOn === true ? "Включен" : "Выключен"}. Этот эффект помогает убрать фоновый шум.`
    const highPassDesc = `High Pass Filter (Фильтр верхних частот) - ${ctx.session.highPassOn === true ? "Включен" : "Выключен"}. Этот эффект отсекает частоты ниже выбранного значения, что может помочь убрать нежелательный низкочастотный шум.`
    const lowPassDesc = `Low Pass Filter (Фильтр нижних частот) - ${ctx.session.lowPassOn === true ? "Включен" : "Выключен"}. Этот эффект отсекает частоты выше выбранного значения, что может помочь убрать нежелательный высокочастотный шум.`
    const compressorDesc = `Compressor (Компрессор) - ${ctx.session.compressorOn === true ? "Включен" : "Выключен"}. Компрессор уменьшает диапазон динамического звука, уравнивая тихие и громкие звуки.`

    const settingsMessage = [mainDesk, noiseGateDesc, highPassDesc, lowPassDesc, compressorDesc].join("\n\n");

    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Noise Gate: ${ctx.session.noiseGateOn}`, "toggle_audio_noisegate"),
      Markup.button.callback(`High Pass Filter: ${ctx.session.highPassOn}`, "toggle_audio_highpass")],
      [Markup.button.callback(`Low Pass Filter ${ctx.session.lowPassOn}`, "toggle_audio_lowpass"),
      Markup.button.callback(`Compressor ${ctx.session.compressorOn}`, "toggle_audio_compressor")],
      [Markup.button.callback("Назад", "effects_settings")],
    ]).resize();

    await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  } catch (err) {
    ctx.reply("Unexpected error, please type /start")
    console.log(err)
  }
}

export async function showPostProcessEffets(ctx) {
  try {
    const mainDesk = "Меню настройки эффектов после обработки, которые применяются к голосовым сообщениям и AI каверам после преобразования голоса. Эти эффекты могут улучшить итоговый звук. Вы можете настроить их по своему вкусу."

    const compressorDesc = `Compressor - ${ctx.session.compressorOn === true ? "Включен" : "Выключен"}. Компрессор уменьшает динамический диапазон звука, уравнивая тихие и громкие звуки.`
    const chorusDesc = `Chorus - ${ctx.session.chorusOn === true ? "Включен" : "Выключен"}. Chorus создаёт звук, как будто несколько источников звука играют одновременно, создавая богатое и полное звучание.`
    const reverbDesc = `Reverb - ${ctx.session.reverbOn === true ? "Включен" : "Выключен"}. Реверберация добавляет эхо к звуку, создавая ощущение пространства или комнаты.`
    const delayDesc = `Delay - ${ctx.session.delayOn === true ? "Включен" : "Выключен"}. Задержка создаёт эффект эха, повторяя звук с задержкой.`
    // const pitchShiftDesc = `PitchShift - ${ctx.session.pitchShiftOn === true ? "Включен" : "Выключен"}. Сдвиг тональности изменяет высоту звука без изменения его скорости.`

    const settingsMessage = [mainDesk, compressorDesc, chorusDesc, reverbDesc, delayDesc].join("\n\n");

    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Compressor: ${ctx.session.compressorOn}`, "toggle_audio_compressor"),
      Markup.button.callback(`Chorus: ${ctx.session.chorusOn}`, "toggle_audio_chorus")],
      [Markup.button.callback(`Reverb: ${ctx.session.reverbOn}`, "toggle_audio_reverb"),
      Markup.button.callback(`Delay: ${ctx.session.delayOn}`, "toggle_audio_delay")],
      // [Markup.button.callback("Включить PitchShift", "toggle_audio_pitchshift")],
      [Markup.button.callback("Назад", "effects_settings")],
    ]).resize();

    await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  } catch (err) {
    ctx.reply("Непредвиденная ошибка, пожалуйста, введите /start")
    console.log(err)
  }
}


export async function showPreProcessSettings(ctx) {
  try {
    const session = ctx.session;

    const compressorThresholdDescription = "Порог компрессии (в дБ) - уровень громкости, при котором звук становится более тихим. По умолчанию: -20 dB.";
    const compressorRatioDescription = "Соотношение компрессии - насколько сильно звук становится тише, когда превышает порог. По умолчанию: 4.";
    const highpassDescription = "Частота среза фильтра верхних частот (в Гц) - отсекает низкие звуки, оставляя только высокие. По умолчанию: 100 Гц.";
    const lowpassDescription = "Частота среза фильтра нижних частот (в Гц) - отсекает высокие звуки, оставляя только низкие. По умолчанию: 5000 Гц.";
    const noiseGateThresholdDescription = "Порог NoiseGate (в дБ) - уровень громкости, при котором тихие звуки или шумы удаляются. По умолчанию: -100 dB.";

    const settingsMessage = [
      compressorThresholdDescription,
      compressorRatioDescription,
      highpassDescription,
      lowpassDescription,
      noiseGateThresholdDescription
    ].join("\n\n");

    // Отправьте сообщение settingsMessage пользователю или используйте его по своему усмотрению.

    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Порог Компресии ${session.compressorThreshold}`, "effect_compressor"), Markup.button.callback(`Соотношение Компресии ${session.compressorRatio}`, "effect_compressor_ratio")],
      [Markup.button.callback(`Порог Lowpass ${session.lowpassCutoff}`, "effect_lowpass"), Markup.button.callback(`Порог HighPass ${session.highpassCutoff}`, "effect_highpass")],
      [Markup.button.callback(`Порог NoiseGate ${session.noiseGateThreshold}`, "effect_noisegate_threshold")],
      [Markup.button.callback("Назад", "effects_settings")],
    ]).resize();

    await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);

  } catch (e) {
    console.error(e);
  }
}

export async function showPostProcessSettings(ctx) {
  try {
    const session = ctx.session;

    const chorusRateDescription = "Скорость Chorus в Гц - насколько быстро звук 'пульсирует'. По умолчанию: 1.5 Гц.";
    const chorusDepthDescription = "Глубина Chorus - насколько сильный эффект 'пульсации'. По умолчанию: 0.2.";
    const reverbRoomDescription = "Размер комнаты реверберации - насколько большое пространство имитируется эхом. По умолчанию: 0.5.";
    const reverbWetDescription = "Уровень реверберации - насколько сильно слышен эффект эха. По умолчанию: 0.3.";
    const delayTimeDescription = "Время задержки в секундах - насколько долго звук задерживается перед его повторением. По умолчанию: 0.5 секунды.";
    const delayMixDescription = "Смешивание задержки - баланс между оригинальным звуком и звуком с эффектом задержки. По умолчанию: 0.5.";

    const settingsMessage = [
      chorusRateDescription,
      chorusDepthDescription,
      reverbRoomDescription,
      reverbWetDescription,
      delayTimeDescription,
      delayMixDescription
    ].join("\n\n");

    // Отправьте сообщение settingsMessage пользователю или используйте его по своему усмотрению.

    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Скорость Chorus ${session.chorusRate}`, "effect_chorus_rate"), Markup.button.callback(`Глубина Chorus ${session.chorusDepth}`, "effect_chorus_depth")],
      [Markup.button.callback(`Размер комнаты реверберации ${session.reverbRoomSize}`, "effect_reverb_room"), Markup.button.callback(`Уровень реверберации ${session.reverbWetLevel}`, "effect_reverb_wet")],
      [Markup.button.callback(`Delay: Время задержики ${session.delayTime}`, "effect_delay_time"), Markup.button.callback(`Delay смешивание задержки ${session.delayMix}`, "effect_delay_mix")],
      [Markup.button.callback("Назад", "effects_settings")],
    ]).resize();

    await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  } catch (e) {
    console.error(e);
  }
}

export async function showOthersEffets(ctx) {
  try {
    const autoTune = `Автотюн, отличается от нейросети тем, что можно тонко настроить,есть 2 режима : авто и ручной, р ручном режиме эффект применяется на обычное преобразование`
    // const phoneCall = `Телефонный звонок - ${ctx.session.phoneEffect === true ? "Включен" : "Выключен"}. Эффект который отрезает нижние и верхние частоты, работает на 3-ку, в будущем планирует улучшение.`
    const pitchShiftDesc = `PitchShift - ${ctx.session.pitchShiftOn === true ? "Включен" : "Выключен"}. Сдвиг тональности изменяет высоту звука без изменения его скорости.`

    const settingsMessage = [autoTune, pitchShiftDesc].join("\n\n");

    const settingsKeyboard = Markup.inlineKeyboard([
      // [Markup.button.callback("Переключить эффект телефона", "toggle_audio_phoneEffect")],
      [Markup.button.callback(`Автотюн: ${ctx.session.autoTune}`, "toggle_audio_autotune")],
      [Markup.button.callback(`PitchShift: ${ctx.session.pitchShiftOn}`, "toggle_audio_pitchshift")],
      [Markup.button.callback("Назад", "effects_settings")],
    ]).resize();

    await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  } catch (err) {
    ctx.reply("Непредвиденная ошибка, пожалуйста, введите /start")
    console.log(err)
  }
}

export async function showOthersEffetsSettings(ctx) {
  try {

    const session = ctx.session;


    const autoTune = `Автотюн, отличается от нейросети тем, что можно тонко настроить,есть 2 режима : авто и ручной, р ручном режиме эффект применяется на обычное преобразование\nВ ручном режиме нужно выставить ноту и Scale`
    // const phoneCall = `Телефонный звонок - ${ctx.session.phoneEffect === true ? "Включен" : "Выключен"}. Эффект который отрезает нижние и верхние частоты, работает на 3-ку, в будущем планирует улучшение.`
    const pitchShiftDesc = `PitchShift - ${ctx.session.pitchShiftOn === true ? "Включен" : "Выключен"}. Сдвиг тональности изменяет высоту звука без изменения его скорости.`

    const settingsMessage = [autoTune, pitchShiftDesc].join("\n\n");

    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Переключить режим автотюна: ${session.autotune_mode}`, "toggle_autotune_mode")],
      [Markup.button.callback("Автотюн: Воздействие - " + session.autotune_attack, "effect_autotune_attack"), Markup.button.callback("Автотюн: Сила - " + session.autotune_strength, "effect_autotune_str")],
      [Markup.button.callback("Автотюн: Нота - " + session.autotune_note, "effect_autotune_note"), Markup.button.callback("Автотюн: Scale - " + session.autotune_scale, "effect_autotune_scale")],
      [Markup.button.callback(`PitchShift: ${session.pitchShift}`, "effect_pitchshift")],
      [Markup.button.callback("Назад", "effects_settings")],
    ]).resize();

    await ctx.replyWithMarkdown(settingsMessage, settingsKeyboard);
  } catch (err) {
    ctx.reply("Непредвиденная ошибка, пожалуйста, введите /start")
    console.log(err)
  }
}

