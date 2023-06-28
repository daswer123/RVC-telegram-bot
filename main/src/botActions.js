import { showMenu, showSettings, showCurrentSettings } from "./botFunction.js";
import { INITIAL_SESSION, characters } from "./variables.js";
import { Markup } from "telegraf";
import fs from 'fs'

export function registerBotActions(bot) {

     bot.action("menu", async (ctx) => {
      ctx.session ??= {...INITIAL_SESSION}
      showMenu(ctx)
    })
    bot.action("current_settings", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        await showCurrentSettings(ctx);
      });
      
      bot.action("characters", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        const characterButtons = characters.map((character, index) => {
          return Markup.button.callback(character.name, `character-${index}`);
        });
      
        await ctx.reply(
          "Выберите персонажа ( Пока только из игры 'Зайчик' )'",
          Markup.inlineKeyboard([...characterButtons, Markup.button.callback("Назад", "menu")], {
            columns: 3,
          }).resize()
        );
      });
      
      characters.forEach((character, index) => {
        bot.action(`character-${index}`, async (ctx) => {
          ctx.session.model_path = character.model_path;
          ctx.session.index_path = character.index_path;
          ctx.session.char_photo = character.char_photo;
          ctx.session.name = character.name;
          ctx.session.gender = character.gender;
      
          const photo = { source: fs.readFileSync(character.char_photo) };
          const caption = `*${character.name}*\n${character.description}\nПол: ${character.gender}`;
      
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
      
          // Отправка сообщения с кнопками
          await ctx.reply(
            "Выберите свой пол: (Нужно для правильной обработки голоса)",
            Markup.inlineKeyboard([
              [
                Markup.button.callback("Выбрать (я парень)", "select_male"),
                Markup.button.callback("Выбрать (я девушка)", "select_female"),
              ],
              [Markup.button.callback("Назад", "back")],
            ]).resize()
          );
      
          // Сохранение идентификатора нового сообщения в сессии
          ctx.session.prevMessageId = newMessage.message_id;
      
        });
      });
      
      
      bot.action("select_male",async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        ctx.session.pith = ctx.session.gender === "male" ? 0 : ctx.session.gender === "female" ? 12 : 6;
        ctx.session.voice_preset = "male"
        ctx.reply("Персонаж выбран, теперь кидай свой голос и получишь прикол!");
      });
      
      bot.action("select_female",async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        ctx.session.pith = ctx.session.gender === "female" ? 0 : ctx.session.gender === "male" ? 12 : -6;
        ctx.session.voice_preset = "female"
        ctx.reply("Персонаж выбран, теперь кидай свой голос и получишь прикол!");
      });
      
      bot.action("back", (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        const characterButtons = characters.map((character, index) => {
          return Markup.button.callback(character.name, `character-${index}`);
        });
      
        ctx.editMessageText(
          "Выберите персонажа",
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
          ctx.session.settingPith = true;
          await ctx.reply("Введите значение Pith от -14 до 14:");
          await ctx.answerCbQuery();
        });
      
      bot.action("set_method", async (ctx) => {
        const methodKeyboard = Markup.inlineKeyboard([
          Markup.button.callback("Harvest", "method_harvest"),
          Markup.button.callback("Crepe", "method_crepe"),
          Markup.button.callback("Mango-Crepe", "method_mangio-crepe"),
        ]).resize();
        await ctx.reply("Выберите метод:", methodKeyboard);
      });
      
      
      bot.action(/method_(harvest|crepe|mangio-crepe)/, async (ctx) => {
        const methodValue = ctx.match[1];
        ctx.session.method = methodValue;
        await ctx.reply(`Method установлен на ${methodValue}`);
        await ctx.answerCbQuery();
      });
      
      bot.action("set_mangio_crepe_hop", async (ctx) => {
          ctx.session.settingMangioCrepeHop = true;
          await ctx.reply("Введите значение Mangio-Crepe Hop от 64 до 250:");
          await ctx.answerCbQuery();
        });
        
        bot.action("set_feature_ratio", async (ctx) => {
          ctx.session.settingFeatureRatio = true;
          await ctx.reply("Введите значение feature ratio от 0 до 1:");
          await ctx.answerCbQuery();
        });
        
        bot.action("set_protect_voiceless", async (ctx) => {
          ctx.session.settingProtectVoiceless = true;
          await ctx.reply("Введите значение Protect voiceless от 0 до 0.5:");
          await ctx.answerCbQuery();
        });

  }
