import { showMenu, showSettings, showCurrentSettings } from "./botFunction.js";
import { INITIAL_SESSION, characters } from "./variables.js";
import { Markup } from "telegraf";

export async function setBotCommands(bot) {
    await bot.telegram.setMyCommands([
      { command: "start", description: "Начать работу с ботом" },
      { command: "settings", description: "Настройки голоса" },
      { command: "characters", description: "Выбрать персонажа" },
      { command: "current_settings", description: "Показать текущие настройки" },
      { command: "menu", description: "Показать меню"},
      { command: "help", description: "Показать список команд" },
    ]);
  }

export function registerBotCommands(bot) {
    bot.command("start", async (ctx) => {
        ctx.session = { ...INITIAL_SESSION };
        await ctx.reply("Привет! Я бот для изменения голоса. Для начала работы выберите персонажа /characters .\n\nДля просмотра списка команд введите /help\nПросто запишите голосовое сообщение и бот пришлет вам его через 10-20 секунд")
        await ctx.reply("По-умолчанию стоит Алиса для мужского голоса")
        await showMenu(ctx)
      });
      
      bot.command("help", async (ctx) => {
        if (Object.keys(ctx.session).length < 2) {
        ctx.session = INITIAL_SESSION;
       } 
        const message = "Доступные команды:\n" +
                        "/start - начать работу с ботом\n" +
                        "/settings - настройки бота\n" +
                        "/characters - выбрать персонажа\n" +
                        "/current_settings - Показать текущие настройки\n" +
                        "/menu - показать меню\n"
                        "/help - показать это сообщение";
        await ctx.reply(message);
      });
      
      
      
      bot.command("settings", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        await showSettings(ctx);
      });
      
      bot.command("current_settings", async (ctx) => {
        ctx.session ??= {...INITIAL_SESSION}
        await showCurrentSettings(ctx);
      });

      bot.command("characters", async (ctx) => {
        const characterButtons = characters.map((character, index) => {
          return Markup.button.callback(character.name, `character-${index}`);
        });
      
        await ctx.reply(
          "Выберите персонажа ( Пока только из игры 'Зайчик' )'",
          Markup.inlineKeyboard([...characterButtons, Markup.button.callback("Назад", "menu")], {
            columns: 3,
          }).resize()
        );
      })

}


  