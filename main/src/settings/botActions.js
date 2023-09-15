import { Markup } from "telegraf";
import { showSettings } from "../menus/settingsMenu.js";
import { showCurrentSettings } from "../menus/mainMenu.js";
import { VOICES } from "../variables.js"

export function registerSettingsBotActions(bot) {

    bot.action("settings", async (ctx) => {
        await showSettings(ctx);
    });

    bot.action("current_settings", async (ctx) => {
        await showCurrentSettings(ctx);
    });

    bot.action("set_pith", async (ctx) => {
        ctx.session.settingPith = true;
        await ctx.reply("Введите значение Pith от -14 до 14:");
        await ctx.answerCbQuery();
        ;
    });

    bot.action("set_voice_speed", async (ctx) => {
        ctx.session.settingVoiceSpeed = true;
        await ctx.reply("Введите скорость речи для режима текст в звук");
        await ctx.answerCbQuery();
    })

    bot.action("set_minPich", async (ctx) => {
        ctx.reply("Введите, либо значение в Гц или формат [Нота][Октава]\nНапример: C0, C#0\nМожно ввести так: 50\nМинимальное значение 1Гц или С0 или E10")

        ctx.session.waitForMinPich = true
    })

    bot.action("set_maxPich", async (ctx) => {
        ctx.reply("Введите, либо значение в Гц или формат [Нота][Октава]\nНапример: E10, C#0\nnМожно ввести так: 1100\nМаксимальное значение 16000Гц или С0 или E10")

        ctx.session.waitForMaxPich = true

    })

    bot.action("set_out_voice", async (ctx) => {
        const outputKey = Markup.inlineKeyboard([
            Markup.button.callback("voice", "output_voice"),
            Markup.button.callback("audio", "output_audio"),
        ]).resize();
        await ctx.reply("Выберите тип аудио в ответ на ваше сообещние:", outputKey);
    });

    bot.action(/output_(voice|audio)/, async (ctx) => {
        const outputValue = ctx.match[1];
        ctx.session.voiceOrAudioOut = outputValue;
        await ctx.reply(
            `Тип сообщения установлен на ${outputValue}`,
            Markup.inlineKeyboard([Markup.button.callback("Назад", "settings")], {
                columns: 3,
            }).resize()
        );
        await ctx.answerCbQuery();
    });

    bot.action("set_method", async (ctx) => {
        const methodKeyboard = Markup.inlineKeyboard([
            Markup.button.callback("Harvest", "method_harvest"),
            Markup.button.callback("Crepe", "method_crepe"),
            Markup.button.callback("Mango-Crepe", "method_mangio-crepe"),
            Markup.button.callback("Rmvpe", "method_rmvpe"),
            Markup.button.callback("Rmvpe+", "method_rmvpeplus"), // Заменено "rmvpe+" на "rmvpeplus"
        ]).resize();
        await ctx.reply("Выберите метод:", methodKeyboard);
    });


    bot.action(/method_(harvest|crepe|mangio-crepe|rmvpeplus|rmvpe)/, async (ctx) => { // Заменено "rmvpe+" на "rmvpeplus"
        let methodValue = ctx.match[1];
        if (methodValue === "rmvpeplus") {
            methodValue = "rmvpe+"
        }

        ctx.session.method = methodValue;

        await ctx.reply(
            `Method установлен на ${methodValue}`,
            Markup.inlineKeyboard([Markup.button.callback("Назад", "settings")], {
                columns: 3,
            }).resize()
        );
        await ctx.answerCbQuery();
    });

    bot.action("set_voice", async (ctx) => {
        await ctx.reply(`Выберите желаемый голос для создания голосовой болванки для вашего текста, что бы потом преобразовать её в голос персонажа\nAidar и Eugene мужские\nBaya более мягкий женский голос\nXenia - грубый женский голос\n остальные голоса женские`);
        const voiceKeyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback("Aidar", "voice_aidar"),
                Markup.button.callback("Eugene", "voice_eugene"),
            ],
            [
                Markup.button.callback("Kseniya", "voice_kseniya"),
                Markup.button.callback("Xenia", "voice_xenia"),
                Markup.button.callback("Baya", "voice_baya"),
            ],
            [
                Markup.button.callback("YANDEX", "some"),
            ],
            [
                Markup.button.callback("Levitan", "voice_yandex_levitan"),
                Markup.button.callback("Zahar", "voice_yandex_zahar"),
                Markup.button.callback("Silaerkan", "voice_yandex_silaerkan"),
            ],
            [
                Markup.button.callback("Oksana", "voice_yandex_oksana"),
                Markup.button.callback("Jane", "voice_yandex_jane"),
                Markup.button.callback("Omazh", "voice_yandex_omazh"),
            ],
            [
                Markup.button.callback("Kolya", "voice_yandex_kolya"),
                Markup.button.callback("Kostya", "voice_yandex_kostya"),
                Markup.button.callback("Nastya", "voice_yandex_nastya"),
            ],
            [
                Markup.button.callback("Sasha", "voice_yandex_sasha"),
                Markup.button.callback("Nick", "voice_yandex_nick"),
            ],
            [
                Markup.button.callback("Zhenya", "voice_yandex_zhenya"),
                Markup.button.callback("Tanya", "voice_yandex_tanya"),
                Markup.button.callback("Ermilov", "voice_yandex_ermilov"),
            ],
            [
                Markup.button.callback("Alyss", "voice_yandex_alyss"),
                Markup.button.callback("Ermil with Tunning", "voice_yandex_ermil_with_tunning"),
                Markup.button.callback("Robot", "voice_yandex_robot"),
            ],
            [
                Markup.button.callback("Dude", "voice_yandex_dude"),
                Markup.button.callback("Zombie", "voice_yandex_zombie"),
                Markup.button.callback("Smoky", "voice_yandex_smoky"),
            ],
            [Markup.button.callback("Назад", "settings")],
        ]).resize();
        await ctx.reply("Выберите голос:", voiceKeyboard);
    });

    bot.action("set_voice", async (ctx) => {
        await ctx.reply(`Выберите желаемый голос для создания голосовой болванки для вашего текста, что бы потом преобразовать её в голос персонажа.`);

        const buttons = VOICES.map((v) => Markup.button.callback(v.name, `voice_${v.id}`));

        // Разделение кнопок на группы по три
        const buttonRows = [];
        for (let i = 0; i < buttons.length; i += 3) {
            buttonRows.push(buttons.slice(i, i + 3));
        }

        const voiceKeyboard = Markup.inlineKeyboard(buttonRows).resize();

        await ctx.reply("Выберите голос:", voiceKeyboard);
    });

    bot.action(/voice_(.*)/, async (ctx) => {
        const voiceId = ctx.match[1];
        const voice = VOICES.find((v) => v.id === voiceId);
        if (!voice) {
            await ctx.reply("Голос не найден");
            return;
        }

        ctx.session.voiceActor = voice.id;

        await ctx.reply(
            `Текстовый голос установлен на ${voice.name}`,
            Markup.inlineKeyboard([Markup.button.callback("Назад", "settings")], {
                columns: 3,
            }).resize()
        );
        await ctx.answerCbQuery();
    });

    bot.action("set_mangio_crepe_hop", async (ctx) => {

        ctx.session.settingMangioCrepeHop = true;
        await ctx.reply("Введите значение Mangio-Crepe Hop от 64 до 250:");
        await ctx.answerCbQuery();
        ;
    });

    bot.action("set_feature_ratio", async (ctx) => {

        ctx.session.settingFeatureRatio = true;
        await ctx.reply("Введите значение feature ratio от 0 до 1:");
        await ctx.answerCbQuery();
        ;
    });

    bot.action("set_protect_voiceless", async (ctx) => {

        ctx.session.settingProtectVoiceless = true;
        await ctx.reply("Введите значение Protect voiceless от 0 до 0.5:");
        await ctx.answerCbQuery();
        ;
    });

}