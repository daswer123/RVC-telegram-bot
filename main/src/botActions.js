import { showMenu, showSettings, showCurrentSettings } from "./botFunction.js";
import { INITIAL_SESSION, characters } from "./variables.js";
import { Markup } from "telegraf";
import fs from 'fs'

export function groupCharactersByCategory(characters) {
  const categories = {};
  characters.forEach((character) => {
    const category = character.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(character);
  });
  return categories;
}

const groupedCharacters = groupCharactersByCategory(characters);

export function registerBotActions(bot) {

     bot.action("menu", async (ctx) => {
      ctx.session ??= {...INITIAL_SESSION}

      ctx.session.waitingForCover = false;
      ctx.session.mergeAudio = false;
      
      showMenu(ctx)
    })
    bot.action("current_settings", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        await showCurrentSettings(ctx);
      });

      bot.action("cover", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        ctx.session.waitingForCover = true;
        await ctx.reply(
          "Вы можете создать ИИ кавер с голосом вашего персонажа\n\nПеред тем как начать настройте высоту тона персонажа в настройках, что бы он соответсвовал голосу певца\nОбычно если у вас Муж. голос и песня с муж. Голосом то ставьте Pith 0\nЕсли у вас муж. голос, а поёт девушка то ставьте Pitch 12\nИ все тоже самое для женского голоса только наоборот\n\nИмейте ввиду что под разные песни нужно корректировать Pitch\n\nЧто бы отменить текущий режим введите любые буквы\n\nОтправьте ссылку на ютуб или загрузите боту напрямую аудиофайл ",
          Markup.inlineKeyboard([Markup.button.callback("Изменить Pitch", "set_pith"),Markup.button.callback("Меню", "menu")], {
            columns: 3,
          }).resize()
        );
      })
      
      bot.action("characters", async (ctx) => {
        ctx.session ??= { ...INITIAL_SESSION };
        const categoryButtons = Object.keys(groupedCharacters).map((category, index) => {
          return Markup.button.callback(category, `category-${index}`);
        });
      
        await ctx.reply(
          "Выберите категорию:",
          Markup.inlineKeyboard([...categoryButtons, Markup.button.callback("Назад", "menu")], {
            columns: 3,
          }).resize()
        );
      });
      
      Object.entries(groupedCharacters).forEach(([category, charactersInCategory], categoryIndex) => {
        bot.action(`category-${categoryIndex}`, async (ctx) => {
          ctx.session.currentCategoryIndex = categoryIndex
          const characterButtons = charactersInCategory.map((character, index) => {
            return Markup.button.callback(character.name, `character-${categoryIndex}-${index}`);
          });
      
          await ctx.reply(
            'Выберите персонажа:',
            Markup.inlineKeyboard([...characterButtons, Markup.button.callback("Назад", "characters")], {
              columns: 3,
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

            console.log(character.audio_sample)
      
            const photo = { source: fs.readFileSync(character.char_photo) };
            const caption = `*${character.name}*\n${character.description}\nПол: ${character.gender}`;
            let audio_sample;

            if(character.audio_sample){
              audio_sample = { source: fs.readFileSync(character.audio_sample) };
            }
            

            
      
            // Удаление предыдущего сообщения с фотографией
            if (ctx.session.prevMessageId) {
              await ctx.deleteMessage(ctx.session.prevMessageId);
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
            if(audio_sample){
              await ctx.replyWithAudio( audio_sample, { caption: 'Пример голоса' });
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
      });
      
      
      
      bot.action("select_male",async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        ctx.session.pith = ctx.session.gender === "male" ? 0 : ctx.session.gender === "female" ? 12 : 6;
        ctx.session.voice_preset = "male"
        await ctx.reply(
          "Персонаж выбран, теперь записывай голосовое и получишь чудо!",
          Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
            columns: 3,
          }).resize()
        );
      });
      
      bot.action("select_female",async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        ctx.session.pith = ctx.session.gender === "female" ? 0 : ctx.session.gender === "male" ? -12 : -6;
        ctx.session.voice_preset = "female"
        await ctx.reply(
          "Персонаж выбран, теперь записывай голосовое и получишь чудо!",
          Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
            columns: 3,
          }).resize()
        );
      });
      
      bot.action("back", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        const categoryButtons = Object.keys(groupedCharacters).map((category, index) => {
          return Markup.button.callback(category, `category-${index}`);
        });
      
        await ctx.reply(
          "Выберите категорию персонажей:",
          Markup.inlineKeyboard([...categoryButtons], {
            columns: 2,
          }).resize()
        );
      });

      bot.action("about_back", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
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
      });


      bot.action("settings", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        await showSettings(ctx);
      });
      
      bot.action("set_pith", async (ctx) => {
          ctx.session ??= {...INITIAL_SESSION}
          ctx.session.settingPith = true;
          await ctx.reply("Введите значение Pith от -14 до 14:");
          await ctx.answerCbQuery();
          ;
        });

      bot.action("set_vocal_volume", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        ctx.session.settingVocalVolume = true;
        await ctx.reply("Введите громкость вокала для ИИ кавера от 0 до 3, где 1 стандартное значение");
        await ctx.answerCbQuery();

      })

      bot.action("set_instrumental_volume", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        ctx.session.settingInstrumentVolume = true;
        await ctx.reply("Введите громкость инструментала для ИИ кавера от 0 до 3, где 1 стандартное значение");
        await ctx.answerCbQuery();
      })
      
      bot.action("set_method", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        const methodKeyboard = Markup.inlineKeyboard([
          Markup.button.callback("Harvest", "method_harvest"),
          Markup.button.callback("Crepe", "method_crepe"),
          Markup.button.callback("Mango-Crepe", "method_mangio-crepe"),
        ]).resize();
        await ctx.reply("Выберите метод:", methodKeyboard);
      });
      
      
      bot.action(/method_(harvest|crepe|mangio-crepe)/, async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        const methodValue = ctx.match[1];
        ctx.session.method = methodValue;
        await ctx.reply(
          `Method установлен на ${methodValue}`,
          Markup.inlineKeyboard([Markup.button.callback("Назад", "settings")], {
            columns: 3,
          }).resize()
        );
        await ctx.answerCbQuery();
      });
      
      bot.action("set_mangio_crepe_hop", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
          ctx.session.settingMangioCrepeHop = true;
          await ctx.reply("Введите значение Mangio-Crepe Hop от 64 до 250:");
          await ctx.answerCbQuery();
          ;
        });
        
        bot.action("set_feature_ratio", async (ctx) => {
          ctx.session ??= {...INITIAL_SESSION}
          ctx.session.settingFeatureRatio = true;
          await ctx.reply("Введите значение feature ratio от 0 до 1:");
          await ctx.answerCbQuery();
          ;
        });
        
        bot.action("set_protect_voiceless", async (ctx) => {
          ctx.session ??= {...INITIAL_SESSION}
          ctx.session.settingProtectVoiceless = true;
          await ctx.reply("Введите значение Protect voiceless от 0 до 0.5:");
          await ctx.answerCbQuery();
          ;
        });

  }
