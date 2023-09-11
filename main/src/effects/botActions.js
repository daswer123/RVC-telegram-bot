import { Markup } from "telegraf";
import { showEffectsSettings, showOthersEffets, showOthersEffetsSettings, showPostProcessEffets, showPostProcessSettings, showPreProcessEffets, showPreProcessSettings } from "../menus/effectsMenu.js";

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

    bot.action("effect_autotune_scale", async (ctx) => {
        await ctx.reply("Выберите scale, который будет использоваться при автотюне, работает только в ручном режиме",
            Markup.inlineKeyboard([
                Markup.button.callback('Major', 'major'),
                Markup.button.callback('Minor', 'minor'),
                Markup.button.callback('Chromatic', 'chromatic'),
                Markup.button.callback('Pentatonic', 'pentatonic'),
                Markup.button.callback('Назад', 'show_other_effects_settings')
            ]).resize()
        );
    });

    bot.action(['major', 'minor', 'chromatic', 'pentatonic'], (ctx) => {
        ctx.session.autotune_scale = ctx.update.callback_query.data;
        ctx.reply(`Scale для автотюна: ${ctx.session.autotune_scale}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'show_other_effects_settings')
        ]));
    });

    bot.action("effect_autotune_note", async (ctx) => {
        ctx.reply("Пожалуйста, введите желаемую ноту для настройки автотюна. " +
            "Поддерживаются все двенадцать нот западной хроматической гаммы, и они могут быть заданы любым допустимым энгармоническим обозначением. " +
            "Напомним, что двойные диезы и двойные бемоли не допускаются. " +
            "Например, 'F' и 'E#' обозначают одну и ту же ноту. Другие примеры валидных нот: 'A', 'Bb', 'C#', 'D', 'Eb', 'G#'.");

        ctx.session.waitForAutotuneNote = true;
    });

    bot.action("toggle_autotune_mode", async (ctx) => {
        await ctx.reply(
            "Выберите режим работы автотюна\nРучной режим - ручной, вы сами задаете scale и ноту, работает на обычное преобразованиме голоса\nАвто режим - автоматический режим который работает только когда вы создаете AI каверы",
            Markup.inlineKeyboard([
                Markup.button.callback('Авто', 'auto'),
                Markup.button.callback('Ручной', 'manual'),
                Markup.button.callback('Назад', 'show_other_effects_settings')
            ]).resize()
        );
    });

    bot.action(['auto', 'manual'], (ctx) => {
        ctx.session.autotune_mode = ctx.update.callback_query.data;
        ctx.reply(`Режим автотюна был переключен на: ${ctx.session.autotune_mode}`,
            Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'show_other_effects_settings')
            ]).resize()
        );
    });



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
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })



    // bot.action("toggle_audio_reverb", async (ctx) => {
    //     ctx.reply("Реверберация успешно включенна")
    //     ctx.session.reverbOn = ctx.session.reverbOn === true ? false : true
    //     ctx.reply(`Реверберация успешно ${ctx.session.reverbOn === true ? "Включенна" : "Выключенна"}`, Markup.inlineKeyboard([
    //         Markup.button.callback('Назад', 'effects_settings'),
    //     ]))
    // })

    // bot.action("toggle_audio_echo", async (ctx) => {
    //     ctx.session.echoOn = ctx.session.echoOn === true ? false : true
    //     ctx.reply(`Эхо успешно ${ctx.session.echoOn === true ? "Включенно" : "Выключенно"}`, Markup.inlineKeyboard([
    //         Markup.button.callback('Назад', 'effects_settings'),
    //     ]))
    // })

    bot.action("toggle_audio_autotune", async (ctx) => {
        ctx.session.autoTune = ctx.session.autoTune === true ? false : true

        ctx.session.neuroAutoTune = false
        ctx.reply(`Автотюн успешно ${ctx.session.autoTune === true ? "Включенн" : "Выключенн"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    // bot.action("toggle_audio_compressor", async (ctx) => {
    //     ctx.session.compressorOn = ctx.session.compressorOn === true ? false : true
    //     ctx.reply(`Компрессор успешно ${ctx.session.compressorOn === true ? "Включен" : "Выключен"}`, Markup.inlineKeyboard([
    //         Markup.button.callback('Назад', 'effects_settings'),
    //     ]))
    // })

    bot.action("toggle_audio_chorus", async (ctx) => {
        ctx.session.chorusOn = ctx.session.chorusOn === true ? false : true
        ctx.reply(`Хорус успешно ${ctx.session.chorusOn === true ? "Включен" : "Выключен"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    bot.action("toggle_audio_reverb", async (ctx) => {
        ctx.session.reverbOn = ctx.session.reverbOn === true ? false : true
        ctx.reply(`Реверберация успешно ${ctx.session.reverbOn === true ? "Включена" : "Выключена"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    bot.action("toggle_audio_delay", async (ctx) => {
        ctx.session.delayOn = ctx.session.delayOn === true ? false : true
        ctx.reply(`Задержка успешно ${ctx.session.delayOn === true ? "Включена" : "Выключена"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    bot.action("toggle_audio_pitchshift", async (ctx) => {
        ctx.session.pitchShiftOn = ctx.session.pitchShiftOn === true ? false : true
        ctx.reply(`Сдвиг тональности успешно ${ctx.session.pitchShiftOn === true ? "Включен" : "Выключен"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    bot.action("toggle_audio_noisegate", async (ctx) => {
        ctx.session.noiseGateOn = ctx.session.noiseGateOn === true ? false : true
        ctx.reply(`Шумозаглушитель успешно ${ctx.session.noiseGateOn === true ? "Включен" : "Выключен"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    bot.action("toggle_audio_highpass", async (ctx) => {
        ctx.session.highPassOn = ctx.session.highPassOn === true ? false : true
        ctx.reply(`Фильтр верхних частот успешно ${ctx.session.highPassOn === true ? "Включен" : "Выключен"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    bot.action("toggle_audio_lowpass", async (ctx) => {
        ctx.session.lowPassOn = ctx.session.lowPassOn === true ? false : true
        ctx.reply(`Фильтр нижних частот успешно ${ctx.session.lowPassOn === true ? "Включен" : "Выключен"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    bot.action("toggle_audio_compressor", async (ctx) => {
        ctx.session.compressorOn = ctx.session.compressorOn === true ? false : true
        ctx.reply(`Компрессор успешно ${ctx.session.compressorOn === true ? "Включен" : "Выключен"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    bot.action("toggle_audio_noisegate", async (ctx) => {
        ctx.session.noiseGateOn = ctx.session.noiseGateOn === true ? false : true
        ctx.reply(`Генератор шума успел ${ctx.session.noiseGateOn === true ? "Включен" : "Выключен"}`, Markup.inlineKeyboard([
            Markup.button.callback('Назад', 'effects_settings'),
        ]))
    })

    bot.action("effect_pitchshift", async (ctx) => {
        ctx.reply("Введите значение для смещение тональности без изменения скорости")

        ctx.session.waitForPitchShift = true
    })


    bot.action("effect_chorus_rate", async (ctx) => {
        ctx.reply("Введите значение для скорости хоруса в Гц. Определяет скорость модуляции эффекта хоруса. Значение по умолчанию: 1.5 Гц")

        ctx.session.waitForChorusRate = true
    })

    bot.action("effect_chorus_depth", async (ctx) => {
        ctx.reply("Введите значение для глубины хоруса. Определяет глубину эффекта хоруса. Значение по умолчанию: 0.2")

        ctx.session.waitForChorusDepth = true
    })

    bot.action("effect_reverb_room", async (ctx) => {
        ctx.reply("Введите значение для размера комнаты реверберации. Определяет, насколько большое пространство имитируется ревербератором. Значение по умолчанию: 0.5")

        ctx.session.waitForReverbRoom = true
    })

    bot.action("effect_reverb_wet", async (ctx) => {
        ctx.reply("Введите значение для уровня реверберации. Определяет уровень обработанного сигнала в выходной смеси. Значение по умолчанию: 0.3")

        ctx.session.waitForReverbWet = true
    })

    bot.action("effect_delay_time", async (ctx) => {
        ctx.reply("Введите значение для времени задержки в секундах. Определяет, насколько долго задерживается сигнал перед его повторением. Значение по умолчанию: 0.5 секунды")

        ctx.session.waitForDelayTime = true
    })

    bot.action("effect_delay_mix", async (ctx) => {
        ctx.reply("Введите значение для смешивания задержки. Определяет баланс между сухим и обработанным сигналами. Значение по умолчанию: 0.5")

        ctx.session.waitForDelayMix = true
    })

    bot.action("effect_compressor", async (ctx) => {
        ctx.reply("Введите значение для порога компрессии (в дБ). Это пороговое значение, при котором компрессор начинает работать. Значение по умолчанию: -20 dB")

        ctx.session.waitForCompressorThreshold = true
    })

    bot.action("effect_compressor_ratio", async (ctx) => {
        ctx.reply("Введите значение для соотношения компрессии. Это определяет, насколько сильно уменьшается сигнал, превышающий порог. Значение по умолчанию: 4")

        ctx.session.waitForCompressorRatio = true
    })

    bot.action("effect_highpass", async (ctx) => {
        ctx.reply("Введите значение для частоты среза фильтра верхних частот в Гц. Значение определяет, какие частоты пропустить. Значение по умолчанию: 100 Гц")

        ctx.session.waitForHighpass = true
    })

    bot.action("effect_lowpass", async (ctx) => {
        ctx.reply("Введите значение для частоты среза фильтра нижних частот в Гц. Значение определяет, какие частоты пропустить. Значение по умолчанию: 5000 Гц")

        ctx.session.waitForLowpass = true
    })

    bot.action("effect_noisegate_threshold", async (ctx) => {
        ctx.reply("Введите значение для порога NoiseGate в дБ. Это пороговое значение, при котором NoiseGate начинает работать. Значение по умолчанию: -100 dB")

        ctx.session.waitForNoiseGateThreshold = true
    })


    bot.action("toggle_audio_effects", async (ctx) => {
        ctx.session.improveAudio = ctx.session.improveAudio === true ? false : true
        ctx.reply("Вы переключили эффекты на голос ( эхо, реверб, нормализация ) на " + ctx.session.improveAudio)
    })

    bot.action("show_preprocess_effects", async (ctx) => {
        showPreProcessEffets(ctx)
    })

    bot.action("show_preprocess_settigns", async (ctx) => {
        showPreProcessSettings(ctx)
    })

    bot.action("show_postprocess_effects", async (ctx) => {
        showPostProcessEffets(ctx)
    })

    bot.action("show_postprocess_settings", async (ctx) => {
        showPostProcessSettings(ctx)
    })

    bot.action("show_other_effects", async (ctx) => {
        showOthersEffets(ctx)
    })

    bot.action("show_other_effects_settings", async (ctx) => {
        showOthersEffetsSettings(ctx)
    })



}