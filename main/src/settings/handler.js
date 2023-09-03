import { Markup } from "telegraf";
import { noteOctaveToFrequency } from "./botFuntions.js";
import { settingsConfig } from "../variables.js";


export const handleSettings = async (ctx) => {

    if (ctx.session.waitForMinPich) {
        const input = ctx.message.text; // ввод пользователя

        // Проверяем, ввел ли пользователь частоту в Гц (число от 1 до 16000)
        const hzValue = parseFloat(input);
        if (hzValue >= 1 && hzValue <= 16000) {
            // прямо записываем значение в Гц
            ctx.session.minPich = hzValue;
            ctx.reply(`Значение в ${ctx.session.minPich} было сохраннено`, Markup.inlineKeyboard([Markup.button.callback("Назад", "settings"), Markup.button.callback("Меню", "menu")], {
                columns: 3,
            }).resize())
        } else {
            // Проверяем, ввел ли пользователь пару [нота][октава]
            const noteMatch = input.match(/^([A-G]b?#?)(-?\d+)$/i);
            if (noteMatch) {
                const note = noteMatch[1];
                const octave = parseInt(noteMatch[2], 10);
                // конвертируем [нота][октава] в Гц и записываем
                ctx.session.minPich = Math.floor(noteOctaveToFrequency(note, octave));
                ctx.reply(`Значение в ${ctx.session.minPich} было сохраннено`, Markup.inlineKeyboard([Markup.button.callback("Назад", "settings"), Markup.button.callback("Меню", "menu")], {
                    columns: 3,
                }).resize())
            } else {
                ctx.reply("Неверный ввод, вводите на английской раскладке или значения от 1 до 16000")
                // Неверный ввод, можно отправить сообщение об ошибке
            }
        }

        ctx.session.waitForMinPich = false
        return true
    }

    if (ctx.session.waitForMaxPich) {
        const input = ctx.message.text; // ввод пользователя

        // Проверяем, ввел ли пользователь частоту в Гц (число от 1 до 16000)
        const hzValue = parseFloat(input);
        if (hzValue >= 1 && hzValue <= 16000) {
            // прямо записываем значение в Гц
            ctx.session.maxPich = hzValue;
            ctx.reply(`Значение в ${ctx.session.maxPich} было сохраннено`, Markup.inlineKeyboard([Markup.button.callback("Назад", "settings"), Markup.button.callback("Меню", "menu")], {
                columns: 3,
            }).resize())
        } else {
            // Проверяем, ввел ли пользователь пару [нота][окtава]
            const noteMatch = input.match(/^([A-G]b?#?)(-?\d+)$/i);
            if (noteMatch) {
                const note = noteMatch[1];
                const octave = parseInt(noteMatch[2], 10);
                // конвертируем [нота][окtава] в Гц и записываем
                ctx.session.maxPich = Math.floor(noteOctaveToFrequency(note, octave));
                ctx.reply(`Значение в ${ctx.session.maxPich} было сохраннено`, Markup.inlineKeyboard([Markup.button.callback("Назад", "settings"), Markup.button.callback("Меню", "menu")], {
                    columns: 3,
                }).resize())
            } else {
                ctx.reply("Неверный ввод, вводите на английской раскладке или значения от 1 до 16000")
                // Неверный ввод, можно отправить сообщение об ошибке
            }
        }

        ctx.session.waitForMaxPich = false
        return true
    }

    // Hanlde default setting

    const value = parseFloat(ctx.message.text);
    let setting;

    for (const key in settingsConfig) {
        if (ctx.session[key]) {
            setting = settingsConfig[key];
            break;
        }
    }

    if (setting && value >= setting.minValue && value <= setting.maxValue) {
        const settingKey = setting.name.toLowerCase().replace(/ /g, "_");
        ctx.session[settingKey] = value;

        console.log(settingKey);
        console.log(ctx.session[settingKey]);

        Object.keys(settingsConfig).forEach(key => {
            ctx.session[key] = false;
        });

        if (settingKey === "voice_volume" || settingKey === "instrumnet_volume") {
            await ctx.reply(
                `${setting.name} установлен на ${value}`,
                Markup.inlineKeyboard([Markup.button.callback("Назад", "ai_settings"), Markup.button.callback("Меню", "menu")], {
                    columns: 3,
                }).resize()
            );
        } else {
            await ctx.reply(
                `${setting.name} установлен на ${value}`,
                Markup.inlineKeyboard([Markup.button.callback("Назад", "settings"), Markup.button.callback("Меню", "menu")], {
                    columns: 3,
                }).resize()
            );
        }

        return true;
    } else if (setting) {
        await ctx.reply(`Пожалуйста, введите корректное значение ${setting.name} от ${setting.minValue} до ${setting.maxValue}`);
        return true;
    }

    return Promise.resolve(false)
}