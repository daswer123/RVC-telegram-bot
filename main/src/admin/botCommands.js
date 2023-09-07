import { showAdminMenu } from "../menus/adminMenu.js"
import { getUserFromDatabase } from "../server/db.js";

export async function registerAdminCommands(bot) {
    bot.command("admin", async (ctx) => {
        // Получаем пользователя из базы данных
        const user = await getUserFromDatabase(ctx.from.id);

        // Проверяем, имеет ли пользователь статус 'admin' или является ли он основным администратором
        if (user && (user.status === 'admin' || ctx.from.id === 225703666)) {
            showAdminMenu(ctx);
        } else {
            ctx.reply("Недостаточно прав");
        }
    });
}