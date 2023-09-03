import { Markup } from "telegraf";

export async function showAdminMenu(ctx){
    const message = `Добро пожаловать в админ меню\nСдесь вы можете:\nЗабанить пользователя\nПосмотреть статистику использования голосов\nОтрегулировать мощность\nПрислать сообщение определенному пользователю\nПрислать сообщение всем пользователям.`
  
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Забанить пользователя`, "admin_ban_user"),Markup.button.callback(`Разбанить пользователя`, "admin_unban_user")],
      [Markup.button.callback(`Посмотреть статистику использования голосов`, "admin_show_stats"),Markup.button.callback(`Очистить папку sessions`, "admin_clear_folder")],
      [Markup.button.callback(`Отрегулировать мощность`, "admin_control_power"),Markup.button.callback(`Показать ID Всех пользователей`, "get_all_user_id")],
      [Markup.button.callback(`Отправить сообщение пользователю`, "admin_send_msg_сurrent"),Markup.button.callback(`Отправить сообщение всем`, "admin_send_msg_all")],
      [Markup.button.callback(`Назад`, "menu")],
    ]).resize();
  
    await ctx.replyWithMarkdown(message, keyboard);
    return message
  }