import { INITIAL_SESSION, characters } from "./variables.js";
import { Markup } from "telegraf";
import { registerAdminCommands } from "./admin/botCommands.js";
import { showCurrentSettings, showMenu } from "./menus/mainMenu.js";
import { showSettings } from "./menus/settingsMenu.js";
import { loadSettings } from "./presets/botFunctions.js";
import { showAICoverSettings } from "./menus/aicoverMenu.js";
import { groupCharactersByCategory } from "./characters/botFunctions.js";
import { getAllOperationsFromDatabase, getUserOperationsFromDatabase } from "./server/db.js";

const groupedCharacters = groupCharactersByCategory(characters);

export async function setBotCommands(bot) {
  await bot.telegram.setMyCommands([
    { command: "start", description: "Начать работу с ботом" },
    { command: "menu", description: "Показать меню" },
    { command: "characters", description: "Выбрать персонажа" },
    { command: "reset", description: "Сбросить настройки до стандартных" },
    { command: "settings", description: "Настройки голоса" },
    { command: "aisettings", description: "Настройки AI кавера" },
    { command: "current_settings", description: "Показать текущие настройки" },
    { command: "cover", description: "Сделать AI кавер голосом выбранного персонажа" },
    { command: "separate", description: "Разделить аудио на вокал и инструментал" },
    { command: "merge", description: "Объединить голос и инструментал" },
    { command: "save", description: "Сохранить текущие настройки" },
    { command: "load", description: "Загрузить сохранённые настройки" },
    { command: "help", description: "Показать список команд" },
  ]);
}

export function registerBotCommands(bot) {
  try {
    bot.command("help", async (ctx) => {
      try {
        const message = "Доступные команды:\n" +
          "/start - начать работу с ботом\n" +
          "/characters - выбрать персонажа\n" +
          "/settings - настройки голоса\n" +
          "/aisettings - настройки AI кавера\n" +
          "/current_settings - Показать текущие настройки\n" +
          "/reset - Сбросить настройки до стандартных\n" +
          "/menu - показать меню\n" +
          "/cover - сделать AI кавер голосом выбранного персонажа\n" +
          "/separate - разделить аудио на вокал и инструментал\n" +
          "/merge - объединить голос и инструментал\n" +
          "/save - сохранить текущие настройки\n" +
          "/load - загрузить сохранённые настройки\n" +
          "/help - показать это сообщение";

        await ctx.reply(message);
      } catch (e) {
        console.log(e);
      }
    });

    registerAdminCommands(bot)

    bot.command("aisettings", async (ctx) => {

      await showAICoverSettings(ctx);
    });

    bot.command("cover", async (ctx) => {
      try {

        ctx.session.waitingForCover = true;
        await ctx.reply(
          "Вы можете создать ИИ кавер с голосом вашего персонажа\n\nПеред тем как начать настройте высоту тона персонажа в настройках, что бы он соответсвовал голосу певца\nОбычно если у вас Муж. голос и песня с муж. Голосом то ставьте Pith 0\nЕсли у вас муж. голос, а поёт девушка то ставьте Pitch 12\nИ все тоже самое для женского голоса только наоборот\n\nИмейте ввиду что под разные песни нужно корректировать Pitch\n\nЧто бы отменить текущий режим введите любые буквы\n\nОтправьте ссылку на ютуб или загрузите боту напрямую аудиофайл ",
          Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
            columns: 3,
          }).resize()
        );
      } catch (e) { console.log(e) }
    })

    bot.command("pos", async (ctx) => {
      try {
        const allOperations = getAllOperationsFromDatabase();
        const userOperations = getUserOperationsFromDatabase(ctx.from.id);

        // Отображение для перевода типов операций
        const operationNames = {
          'handleAICover': 'Создание AI кавера',
          'transformAudio': 'Преобразование голоса',
          'separateAudio': 'Разделение аудио'
        };

        if (userOperations.length === 0) {
          await ctx.reply('У вас нет операций в очереди.');
          return;
        }

        let response = 'Ваши операции:\n';

        userOperations.forEach((userOperation, index) => {
          // Найти позицию операции в общем списке операций
          const queuePosition = allOperations.findIndex(operation => operation.operationId === userOperation.operationId) + 1;
          // Использовать отображение для перевода типов операций
          const operationName = operationNames[userOperation.operationType] || userOperation.operationType;
          response += `Номер в очереди: ${queuePosition} - ${operationName}\n`;
        });

        await ctx.reply(response);
      } catch (e) {
        console.log(e);
        await ctx.reply('Произошла ошибка при получении ваших операций.');
      }
    });


    bot.command("menu", async (ctx) => {
      try {

        await showMenu(ctx);
      } catch (e) { console.log(e) }
    })

    bot.command("load", async (ctx) => {
      try {

        await loadSettings(ctx);
      } catch (e) { console.log(e) }
    })

    bot.command("reset", async (ctx) => {
      try {
        ctx.session = { ...INITIAL_SESSION }
        ctx.reply("Настройки сброшенны до стандартных")
      } catch (e) { console.log(e) }
    })

    bot.command("save", async (ctx) => {
      try {

        // Перед сохранением пресета, спросим у пользователя имя для пресета
        ctx.reply('Пожалуйста, введите имя для вашего пресета:');
        ctx.session.waitForPresetSave = true
      } catch (e) { console.log(e) }
    })

    bot.command("separate", async (ctx) => {
      try {
        // Перед сохранением пресета, спросим у пользователя имя для пресета
        ctx.reply('Киньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
        ctx.session.waitForSeparate = true
      } catch (e) { console.log(e) }
    })

    bot.command("test", async (ctx) => {
      try {

        ctx.session.testVoice = true;
        await ctx.reply("Сейчас будет пройден путь от 0 до 12");
        ;
      } catch (e) { console.log(e) }
    })

    bot.command("id", async (ctx) => {
      try {

        ctx.reply(ctx.session.previousMessageId)
      } catch (e) { console.log(e) }
    })


    bot.command("merge", async (ctx) => {
      try {


        ctx.session.mergeAudio = true;

        await ctx.reply(
          "Загрузите 2 аудиофайла для смешивания. Первое должно быть вокалом а второе инструменталкой.",
          Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
            columns: 3,
          }).resize()
        );
      } catch (e) { console.log(e) }
    })



    bot.command("settings", async (ctx) => {
      try {

        await showSettings(ctx);
        ;
      } catch (e) { console.log(e) }
    });

    bot.command("current_settings", async (ctx) => {
      try {

        await showCurrentSettings(ctx);
        ;
      } catch (e) { console.log(e) }
    });

    bot.command("characters", async (ctx) => {
      try {

        const categoryButtons = Object.keys(groupedCharacters).map((category, index) => {
          return Markup.button.callback(category, `category-${index}`);
        });

        await ctx.reply(
          "Выберите категорию:",
          Markup.inlineKeyboard([...categoryButtons, Markup.button.callback("Назад", "menu")], {
            columns: 3,
          }).resize()
        );
        ;
      } catch (e) { console.log(e) }
    })
  } catch (err) {
    console.log(err)
  }
}


