
import { Markup } from "telegraf";

export async function effectHanlder(ctx) {
    try {
        if (ctx.session.waitForEchoDelay) {
            const input = ctx.message.text; // входные данные пользователя
            ctx.session.echoDelay = Math.max(0.05, Math.min(3, parseFloat(input))); // проверяем и присваиваем входные данные к echoDelay
            ctx.session.waitForEchoDelay = false;
            ctx.reply(`Значение echoDelay было успешно установлено как ${ctx.session.echoDelay}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForEchoPower) {
            const input = ctx.message.text; // входные данные пользователя
            ctx.session.echoPower = Math.max(0.05, Math.min(3, parseFloat(input))); // проверяем и присваиваем входные данные к echoPower
            ctx.session.waitForEchoPower = false;
            ctx.reply(`Значение echoPower было успешно установлено как ${ctx.session.echoPower}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForReverb) {
            const input = ctx.message.text; // входные данные пользователя
            ctx.session.reverbPower = Math.max(0.00001, Math.min(1, parseFloat(input))); // проверяем и присваиваем входные данные к reverbPower
            ctx.session.waitForReverb = false;
            ctx.reply(`Значение reverbPower было успешно установлено как ${ctx.session.reverbPower}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForAutotuneAttack) {
            const input = ctx.message.text; // входные данные пользователя
            ctx.session.autotune_attack = Math.max(0.05, Math.min(1, parseFloat(input))); // проверяем и присваиваем входные данные к autotune_attack
            ctx.session.waitForAutotuneAttack = false;
            ctx.reply(`Значение autotune_attack было успешно установлено как ${ctx.session.autotune_attack}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        if (ctx.session.waitForAutotuneStr) {
            const input = ctx.message.text; // входные данные пользователя
            ctx.session.autotune_strength = Math.max(0.05, Math.min(1, parseFloat(input))); // проверяем и присваиваем входные данные к autotune_strength
            ctx.session.waitForAutotuneStr = false;
            ctx.reply(`Значение autotune_strength было успешно установлено как ${ctx.session.autotune_strength}`, Markup.inlineKeyboard([
                Markup.button.callback('Назад', 'effects_settings')
            ]));
            return;
        }

        return Promise.resolve(false)
    } catch (err) {
        console.log(err)
    }
}