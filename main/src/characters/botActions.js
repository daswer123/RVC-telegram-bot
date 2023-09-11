import { Markup } from "telegraf";
import { groupCharactersByCategory } from "./botFunctions.js";
import { FEMALE_VOICES, MALE_VOICES, characters } from "../variables.js";
import fs from "fs"
import { getRandomVoice } from "./botFunctions.js";

export function registerCharacterBotActions(bot) {

    const groupedCharacters = groupCharactersByCategory(characters);

    bot.action("characters", async (ctx) => {

        try {
            ;
            const categoryButtons = Object.keys(groupedCharacters).map((category, index) => {
                return Markup.button.callback(category, `category-${index}`);
            });

            await ctx.reply(
                "Выберите категорию:",
                Markup.inlineKeyboard([...categoryButtons, Markup.button.callback("Назад", "menu")], {
                    columns: 3,
                }).resize()
            );
        } catch (e) { ctx.reply("Произшла ошибка, введите /start что бы начать сначала") }
    });
    try {
        Object.entries(groupedCharacters).forEach(([category, charactersInCategory], categoryIndex) => {

            bot.action(`category-${categoryIndex}`, async (ctx) => {

                ctx.session.currentCategoryIndex = categoryIndex
                const characterButtons = charactersInCategory.map((character, index) => {
                    return Markup.button.callback(character.name, `character-${categoryIndex}-${index}`);
                });

                await ctx.reply(
                    'Выберите персонажа:',
                    Markup.inlineKeyboard([...characterButtons, Markup.button.callback("Назад", "characters")], {
                        columns: 2,
                    }).resize()
                );
            });

            charactersInCategory.forEach((character, characterIndex) => {
                bot.action(`character-${categoryIndex}-${characterIndex}`, async (ctx) => {
                    ctx.session.model_path = character.model_path;
                    ctx.session.index_path = character.index_path;
                    ctx.session.char_photo = character.char_photo;
                    ctx.session.name = character.name;
                    ctx.session.gender = character.gender;
                    ctx.session.audio_sample = character.audio_sample;

                    console.log(ctx.session.name)
                    const photo = { source: fs.readFileSync(character.char_photo) };
                    const caption = `*${character.name}*\n${character.description}\nПол: ${character.gender}`;
                    let audio_sample;

                    if (character.audio_sample) {
                        audio_sample = { source: fs.readFileSync(character.audio_sample) };
                    }




                    try {
                        // Удаление предыдущего сообщения с фотографией
                        if (ctx.session.prevMessageId) {
                            await ctx.deleteMessage(ctx.session.prevMessageId);
                        }
                    } catch (err) {
                        console.log("err")
                    }

                    // Отправка нового сообщения с фотографией и обновленным заголовком
                    const newMessage = await ctx.replyWithPhoto(
                        photo,
                        {
                            caption,
                            parse_mode: "Markdown",
                        }
                    );

                    console.log(audio_sample)
                    if (audio_sample) {
                        await ctx.replyWithAudio(audio_sample, { caption: 'Пример голоса' });
                    }

                    // Отправка сообщения с кнопками
                    await ctx.reply(
                        "Выберите свой пол: (Нужно для правильной обработки голоса)",
                        Markup.inlineKeyboard([
                            [
                                Markup.button.callback("Выбрать (я парень)", "select_male"),
                                Markup.button.callback("Выбрать (я девушка)", "select_female"),
                            ],
                            [Markup.button.callback("Назад", "about_back")],
                        ]).resize()
                    );

                    // Сохранение идентификатора нового сообщения в сессии
                    ctx.session.prevMessageId = newMessage.message_id;
                });
            });

        })
    } catch (e) { console.log(e) };



    bot.action("select_male", async (ctx) => {

        ctx.session.pith = ctx.session.gender.trim() === "male" ? 0 : ctx.session.gender.trim() === "female" ? 12 : 6;

        if (ctx.session.gender.trim() === "male") {
            ctx.session.voiceActor = getRandomVoice(MALE_VOICES);
        } else {
            ctx.session.voiceActor = getRandomVoice(FEMALE_VOICES);
        }

        ctx.session.voice_preset = "male"
        await ctx.reply(
            "Персонаж выбран, теперь записывай голосовое и получишь чудо!",
            Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
                columns: 3,
            }).resize()
        );
    });

    bot.action("select_female", async (ctx) => {

        ctx.session.pith = ctx.session.gender.trim() === "female" ? 0 : ctx.session.gender.trim() === "male" ? -12 : -6;


        if (ctx.session.gender.trim() === "male") {
            ctx.session.voiceActor = getRandomVoice(MALE_VOICES);
        } else {
            ctx.session.voiceActor = getRandomVoice(FEMALE_VOICES);
        }

        ctx.session.voice_preset = "female"
        await ctx.reply(
            "Персонаж выбран, теперь записывай голосовое и получишь чудо!",
            Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
                columns: 3,
            }).resize()
        );
    });

    bot.action("back", async (ctx) => {
        try {
            const categoryButtons = Object.keys(groupedCharacters).map((category, index) => {
                return Markup.button.callback(category, `category-${index}`);
            });

            await ctx.reply(
                "Выберите категорию персонажей:",
                Markup.inlineKeyboard([...categoryButtons], {
                    columns: 2,
                }).resize()
            );
        } catch (err) { ctx.reply("Что-то пошлоне так, введите /start и начните с начала") }
    });

    bot.action("about_back", async (ctx) => {
        try {
            const charactersInCategory = Object.values(groupedCharacters)[ctx.session.currentCategoryIndex];
            const characterButtons = charactersInCategory.map((character, index) => {
                return Markup.button.callback(character.name, `character-${ctx.session.currentCategoryIndex}-${index}`);
            });

            await ctx.reply(
                "Выберите персонажа:",
                Markup.inlineKeyboard([...characterButtons, Markup.button.callback("Назад", "back")], {
                    columns: 3,
                }).resize()
            );
        } catch (err) { ctx.reply("Что-то пошло не так, введите /start и начните с начала") }
    });

}