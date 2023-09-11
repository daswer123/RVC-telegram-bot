
import { Markup } from "telegraf";
import { isValidNote } from "./botFunctions.js";

export async function effectHanlder(ctx) {
    try {
        // if (ctx.session.waitForEchoDelay) {
        //     const input = ctx.message.text; // входные данные пользователя
        //     ctx.session.echoDelay = Math.max(0.05, Math.min(3, parseFloat(input))); // проверяем и присваиваем входные данные к echoDelay
        //     ctx.session.waitForEchoDelay = false;
        //     ctx.reply(`Значение echoDelay было успешно установлено как ${ctx.session.echoDelay}`, Markup.inlineKeyboard([
        //         Markup.button.callback('Назад', 'effects_settings')
        //     ]));
        //     return;
        // }

        // if (ctx.session.waitForEchoPower) {
        //     const input = ctx.message.text; // входные данные пользователя
        //     ctx.session.echoPower = Math.max(0.05, Math.min(3, parseFloat(input))); // проверяем и присваиваем входные данные к echoPower
        //     ctx.session.waitForEchoPower = false;
        //     ctx.reply(`Значение echoPower было успешно установлено как ${ctx.session.echoPower}`, Markup.inlineKeyboard([
        //         Markup.button.callback('Назад', 'effects_settings')
        //     ]));
        //     return;
        // }


        // if (ctx.session.waitForReverb) {
        //     const input = ctx.message.text; // входные данные пользователя
        //     ctx.session.reverbPower = Math.max(0.00001, Math.min(1, parseFloat(input))); // проверяем и присваиваем входные данные к reverbPower
        //     ctx.session.waitForReverb = false;
        //     ctx.reply(`Значение reverbPower было успешно установлено как ${ctx.session.reverbPower}`, Markup.inlineKeyboard([
        //         Markup.button.callback('Назад', 'effects_settings')
        //     ]));
        //     return;
        // }

        if (ctx.session.waitForCompressorThreshold) {
            const input = ctx.message.text;
            ctx.session.compressorThreshold = Math.max(-40, Math.min(0, parseFloat(input)));
            ctx.session.waitForCompressorThreshold = false;
            ctx.reply(`Значение compressorThreshold было успешно установлено как ${ctx.session.compressorThreshold}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForCompressorRatio) {
            const input = ctx.message.text;
            ctx.session.compressorRatio = Math.max(1, Math.min(20, parseFloat(input)));
            ctx.session.waitForCompressorRatio = false;
            ctx.reply(`Значение compressorRatio было успешно установлено как ${ctx.session.compressorRatio}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForChorusRate) {
            const input = ctx.message.text;
            ctx.session.chorusRate = Math.max(0.01, Math.min(8, parseFloat(input)));
            ctx.session.waitForChorusRate = false;
            ctx.reply(`Значение chorusRate было успешно установлено как ${ctx.session.chorusRate}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForChorusDepth) {
            const input = ctx.message.text;
            ctx.session.chorusDepth = Math.max(0, Math.min(1, parseFloat(input)));
            ctx.session.waitForChorusDepth = false;
            ctx.reply(`Значение chorusDepth было успешно установлено как ${ctx.session.chorusDepth}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForReverbRoom) {
            const input = ctx.message.text;
            ctx.session.reverbRoomSize = Math.max(0, Math.min(1, parseFloat(input)));
            ctx.session.waitForReverbRoom = false;
            ctx.reply(`Значение reverbRoomSize было успешно установлено как ${ctx.session.reverbRoomSize}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForReverbWet) {
            const input = ctx.message.text;
            ctx.session.reverbWetLevel = Math.max(0, Math.min(1, parseFloat(input)));
            ctx.session.waitForReverbWet = false;
            ctx.reply(`Значение reverbWetLevel было успешно установлено как ${ctx.session.reverbWetLevel}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForDelayTime) {
            const input = ctx.message.text;
            ctx.session.delayTime = Math.max(0, Math.min(1, parseFloat(input)));
            ctx.session.waitForDelayTime = false;
            ctx.reply(`Значение delayTime было успешно установлено как ${ctx.session.delayTime}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForDelayMix) {
            const input = ctx.message.text;
            ctx.session.delayMix = Math.max(0, Math.min(1, parseFloat(input)));
            ctx.session.waitForDelayMix = false;
            ctx.reply(`Значение delayMix было успешно установлено как ${ctx.session.delayMix}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForHighpass) {
            const input = ctx.message.text;
            ctx.session.highpassCutoff = Math.max(20, Math.min(20000, parseFloat(input)));
            ctx.session.waitForHighpass = false;
            ctx.reply(`Значение highpassCutoff было успешно установлено как ${ctx.session.highpassCutoff}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'show_preprocess_settigns')
            ]));
            return;
        }

        if (ctx.session.waitForLowpass) {
            const input = ctx.message.text;
            ctx.session.lowpassCutoff = Math.max(20, Math.min(20000, parseFloat(input)));
            ctx.session.waitForLowpass = false;
            ctx.reply(`Значение lowpassCutoff было успешно установлено как ${ctx.session.lowpassCutoff}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'show_preprocess_settigns')
            ]));
            return;
        }

        if (ctx.session.waitForNoiseGateThreshold) {
            const input = ctx.message.text;
            ctx.session.noiseGateThreshold = Math.max(-100, Math.min(0, parseFloat(input)));
            ctx.session.waitForNoiseGateThreshold = false;
            ctx.reply(`Значение noiseGateThreshold было успешно установлено как ${ctx.session.noiseGateThreshold}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'show_preprocess_settigns')
            ]));
            return;
        }


        if (ctx.session.waitForAutotuneAttack) {
            const input = ctx.message.text; // входные данные пользователя
            ctx.session.autotune_attack = Math.max(0.05, Math.min(1, parseFloat(input))); // проверяем и присваиваем входные данные к autotune_attack
            ctx.session.waitForAutotuneAttack = false;
            ctx.reply(`Значение autotune_attack было успешно установлено как ${ctx.session.autotune_attack}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'show_other_effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForAutotuneStr) {
            const input = ctx.message.text; // входные данные пользователя
            ctx.session.autotune_strength = Math.max(0.05, Math.min(1, parseFloat(input))); // проверяем и присваиваем входные данные к autotune_strength
            ctx.session.waitForAutotuneStr = false;
            ctx.reply(`Значение autotune_strength было успешно установлено как ${ctx.session.autotune_strength}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'show_other_effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForPitchShift) {
            const input = ctx.message.text; // входные данные пользователя
            ctx.session.pitchShift = parseFloat(input); // проверяем и присваиваем входные данные к autotune_strength
            ctx.session.waitForPitchShift = false;
            ctx.reply(`Значение Pitchshift было успешно установлено как ${ctx.session.pitchShift}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'show_other_effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForAutotuneNote) {
            const input = ctx.message.text; // входные данные пользователя
            if (isValidNote(input)) {
                ctx.session.autotune_note = input; // проверяем и присваиваем входные данные к autotune_strength
                ctx.session.waitForAutotuneNote = false;
                ctx.reply(`Значение ноты для Autotune было успешно установлено как ${ctx.session.autotune_note}`, Markup.inlineKeyboard([
                    Markup.button.callback('Назад', 'show_other_effects_settings')
                ]));
            } else {
                ctx.session.waitForAutotuneNote = false;
                ctx.reply("Вы не правильно набрали ноту, попробуйте снова", Markup.inlineKeyboard([
                    Markup.button.callback('Назад', 'show_other_effects_settings')
                ]))
            }
            return;
        }



        return Promise.resolve(false)
    } catch (err) {
        console.log(err)
    }
}