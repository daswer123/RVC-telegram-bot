import { createVoiceFolder, resetSession, writeDescriptionFile, writeJsonFile } from "./botFunctions.js"
import { handleMissingModel } from "./handler.js"
import { showCreateMenu } from "../menus/createModelMenu.js";
import { Markup } from "telegraf";

export function registerCreateMenuBotActions(bot) {
bot.action("create_voice_info",async (ctx) => {
    await ctx.reply(`Итак перед тем как дать инструкцию о том что нужно сделать что бы получить свою языковую модель, хочу уточнить пару деталей \nАвтоматического создания модели нет и все образцы которые вы запишете через эти кнопки, я смогу обучить через какое-то время, я сделаю оповещение когда модель будет готова.`)
    await ctx.reply("\nПеред тем как кидать голосовое сообщение убедитесь что вы находитесь в тихом помещение, нет посторонних шумов, качество модели напрямую зависит от качества записанного голосового")
    await ctx.reply("\nВы можете выбрать получить текст и перед вами появится 1 из 10 подготовленных текстов, не обязательно зачитывать именно его, вы можете сами зачитать или напеть что угодно, общая продолжительность должна быть более 90 секунд, иначе не ручаюсь за похожесть, чем больше тем лучше, но не более 5 минут.", Markup.inlineKeyboard([
      Markup.button.callback('Меню', 'show_create_voice_menu')
    ]))
  })

  bot.action("create_voice_name",(ctx) =>{
    ctx.reply("Введите название для вашей голосовой модели")
    ctx.session.waitForModelName = true
  })

  bot.action("create_voice_random_text",async (ctx) =>{
    const text = await getRandomFileContent();

    await ctx.reply(text, Markup.inlineKeyboard([
      [Markup.button.callback('Записать голосовое', 'create_voice_add_sample'),Markup.button.callback('Назад', 'show_create_voice_menu')]
    ]))
  })

  bot.action("create_voice_add_sample",async(ctx) => {
    if(!ctx.session.voiceModelName) {
      ctx.reply("Перед тем как скидывать, инициализируйте модель", Markup.inlineKeyboard([
        Markup.button.callback('Инициализировать модель', 'create_voice_name')
      ]))
      return
    }
    ctx.reply("Вы можете переслать любое голосовое сообщение от кого-либо боту\nСкиньте аудиофайл ( до 20 мб ) или запишите голосовое")
    ctx.session.waitForVoice = true
  })

  bot.action("create_voice_end", async(ctx) => {
    if (!await handleMissingModel(ctx)) return;
  
    await ctx.reply("Все ваши данные были записанны, ждите когда у админа появится время и он сможет обработать и создать вашу голосовую модель", Markup.inlineKeyboard([
      Markup.button.callback('Меню', 'menu')
    ]));
  
    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
    const folderName = ctx.session.voiceModelName
    const voicePath = createVoiceFolder(uniqueId, folderName);
  
    writeDescriptionFile(voicePath, ctx.session);
    console.log("Пользователь завершил сбор датасета и ждет когда его модель будет готова")
    
    writeJsonFile(ctx);
    resetSession(ctx.session);
  })
  


  bot.action("show_create_voice_menu",(ctx) =>{
    ctx.session.waitingForCover = false;
    ctx.session.mergeAudio = false;

    showCreateMenu(ctx)
    return
  })

}