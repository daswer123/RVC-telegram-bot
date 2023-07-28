import { showMenu, showSettings, showCurrentSettings, loadSettings } from "./botFunction.js";
import { INITIAL_SESSION, characters } from "./variables.js";
import { Markup } from "telegraf";
import { groupCharactersByCategory } from "./botActions.js";

const groupedCharacters = groupCharactersByCategory(characters);

export async function setBotCommands(bot) {
  await bot.telegram.setMyCommands([
    { command: "start", description: "Начать работу с ботом" },
    { command: "menu", description: "Показать меню" },
    { command: "characters", description: "Выбрать персонажа" },
    { command: "settings", description: "Настройки голоса" },
    { command: "current_settings", description: "Показать текущие настройки" },
    { command: "cover", description: "Сделать кавер голосом выбранного персонажа" },
    { command: "merge", description: "Обьеденить голос и инструменталку" },
    { command: "save", description: "Сохранить текущие настройки" },
    { command: "load", description: "Загрузить настройки" },
    { command: "help", description: "Показать список команд" },
  ]);
}

export function registerBotCommands(bot) {
  try{
  bot.command("start", async (ctx) => {
    ctx.session = { ...INITIAL_SESSION };
    await ctx.reply("Привет! Я бот для изменения голоса. Для начала работы выберите персонажа /characters .\n\nДля просмотра списка команд введите /help")
    await showMenu(ctx);
  })}catch(e){console.log(e)};

  bot.command("help", async (ctx) => {
    try{
    ctx.session = { ...INITIAL_SESSION };
    const message = "Доступные команды:\n" +
      "/start - начать работу с ботом\n" +
      "/settings - настройки бота\n" +
      "/characters - выбрать персонажа\n" +
      "/current_settings - Показать текущие настройки\n" +
      "/menu - показать меню\n"
    "/cover - сделать кавер голосом выбранного персонажа\n"
    "/merge - обьеденить голос и инструменталку\n"
    "/save - сохранить текущие настройки\n"
    "/load - загрузить сохранненые настройки\n"
    "/help - показать это сообщение";
    await ctx.reply(message);
    ;
  }catch(e){console.log(e)}});

  bot.command("cover", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }
    ctx.session.waitingForCover = true;
    await ctx.reply(
      "Вы можете создать ИИ кавер с голосом вашего персонажа\n\nПеред тем как начать настройте высоту тона персонажа в настройках, что бы он соответсвовал голосу певца\nОбычно если у вас Муж. голос и песня с муж. Голосом то ставьте Pith 0\nЕсли у вас муж. голос, а поёт девушка то ставьте Pitch 12\nИ все тоже самое для женского голоса только наоборот\n\nИмейте ввиду что под разные песни нужно корректировать Pitch\n\nЧто бы отменить текущий режим введите любые буквы\n\nОтправьте ссылку на ютуб или загрузите боту напрямую аудиофайл ",
      Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
        columns: 3,
      }).resize()
    );
}catch(e){console.log(e)}})

  bot.command("menu", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }
    await showMenu(ctx);
    }catch(e){console.log(e)}
  })

  bot.command("load", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }
    await loadSettings(ctx);
    }catch(e){console.log(e)}
  })

  bot.command("save", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }
    // Перед сохранением пресета, спросим у пользователя имя для пресета
    ctx.reply('Пожалуйста, введите имя для вашего пресета:');
    ctx.session.waitForPresetSave = true
    }catch(e){console.log(e)}
  })



  bot.command("test", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }
    ctx.session.testVoice = true;
    await ctx.reply("Сейчас будет пройден путь от 0 до 12");
    ;
}catch(e){console.log(e)}})

  bot.command("id", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }
    ctx.reply(ctx.session.previousMessageId)
}catch(e){console.log(e)}})


  bot.command("merge", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }

    ctx.session.mergeAudio = true;

    await ctx.reply(
      "Загрузите 2 аудиофайла для смешивания. Первое должно быть вокалом а второе инструменталкой.",
      Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
        columns: 3,
      }).resize()
    );
}catch(e){console.log(e)}})



  bot.command("settings", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }
    await showSettings(ctx);
    ;
}catch(e){console.log(e)}});

  bot.command("current_settings", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }
    await showCurrentSettings(ctx);
    ;
}catch(e){console.log(e)}});

  bot.command("characters", async (ctx) => {
    try{
    ctx.session ??= { ...INITIAL_SESSION }
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
}catch(e){console.log(e)}})

}


