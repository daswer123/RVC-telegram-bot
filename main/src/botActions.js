import { Markup } from "telegraf";

import { registerAdminBotActions } from "./admin/botActions.js";
import { registerCreateMenuBotActions } from "./createModel/botActions.js";
import { showMenu } from "./menus/mainMenu.js";
import { registerEffectBotActions } from "./effects/botActions.js";
import { registerSettingsBotActions } from "./settings/botActions.js";
import { registerCharacterBotActions } from "./characters/botActions.js";
import { registerPresetBotActions } from "./presets/botActions.js";
import { registerAiCoverSettingsBotActions } from "./aicoverSettings/botActions.js";

export function registerBotActions(bot) {

  registerAdminBotActions(bot)
  registerCreateMenuBotActions(bot)
  registerEffectBotActions(bot)
  registerSettingsBotActions(bot)
  registerAiCoverSettingsBotActions(bot)
  registerCharacterBotActions(bot)
  registerPresetBotActions(bot)

  // Показать главное меню
  bot.action("menu", async (ctx) => {
    ctx.session.waitingForCover = false;
    ctx.session.mergeAudio = false;
    showMenu(ctx)
  })

  // Обработчик для кнопки "load_preset"
  bot.action('make_predlog', (ctx) => {
    ctx.reply("Напишите какой функционал вы бы хотели видеть в боте, какую голосовую модель стоит добавить.")
    ctx.session.waitForPredlog = true;
  });


  bot.action("cover", async (ctx) => {
    ctx.session.waitingForCover = true;
    await ctx.reply(
      "Вы можете создать ИИ кавер с голосом вашего персонажа\n\nПеред тем как начать настройте высоту тона персонажа в настройках, что бы он соответсвовал голосу певца\nОбычно если у вас Муж. голос и песня с муж. Голосом то ставьте Pith 0\nЕсли у вас муж. голос, а поёт девушка то ставьте Pitch 12\nИ все тоже самое для женского голоса только наоборот\n\nИмейте ввиду что под разные песни нужно корректировать Pitch\n\nЧто бы отменить текущий режим введите любые буквы\n\nОтправьте ссылку на ютуб или загрузите боту напрямую аудиофайл ",
      Markup.inlineKeyboard([Markup.button.callback("Изменить Pitch", "set_pith"), Markup.button.callback("Меню", "menu")], {
        columns: 3,
      }).resize()
    );
  })


  bot.action("support", async (ctx) => {
    ctx.reply("Вы можете поддержать меня скинув небольшую денежку.\n\nЭто даст мне мотивацию работать над ботом и улучшать его.\n\nПоддержать создателя бота вы можете по этой ссылке.\nhttps://www.donationalerts.com/r/daswer123\nМожно по СБП: \n+79267154433\nМожно по номеру карты:\n5536913862883838", Markup.inlineKeyboard([
      Markup.button.callback('Меню', 'menu')
    ]))
  })


  bot.action("separate", async (ctx) => {
    try {
      // Перед сохранением пресета, спросим у пользователя имя для пресета
      ctx.reply('Дополнительные настройки вы можете найти во вкладке, настройки AI кавера\n\nКиньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
      ctx.session.waitForSeparate = true
    } catch (e) { console.log(e) }
  })

}
