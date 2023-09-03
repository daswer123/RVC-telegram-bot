import { Markup } from "telegraf";

export async function showCreateMenu(ctx){
    const message = `Меню создания голосовой модели\nПеред началом инициализируйте модель\nПродолжительность вашего набора данных должна быть 90 секунд или более\n\nНазвание вашей модели:  ${ctx.session.voiceModelName ? ctx.session.voiceModelName :  "Ещё не названно"}\nОписание вашей модели:  ${ctx.session.voiceModelDesc ? ctx.session.voiceModelDesc :  "Не указанно"}\nПол вашей модели:  ${ctx.session.voiceModelGender ? ctx.session.voiceModelGender :  "Не указанно"}`
  
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Инициализоровать голосовую модель`, "create_voice_name")],
      [Markup.button.callback(`Добавить голосовой или аудиообразец голоса`, "create_voice_add_sample")],
      [Markup.button.callback(`Получить текст для озвучивания`, "create_voice_random_text")],
      [Markup.button.callback(`Информация о создание и сроках`, "create_voice_info")],
      [Markup.button.callback("Завершить процедуру для создание модели","create_voice_end")],
      [Markup.button.callback(`Назад`, "menu")],
    ]).resize();
  
    await ctx.replyWithMarkdown(message, keyboard);
    return message
  }