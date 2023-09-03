import { showAdminMenu } from "../menus/adminMenu.js"

export async function registerAdminCommands(bot) {
    bot.command("admin", async (ctx) => {
        if (ctx.from.id === 225703666) {
            showAdminMenu(ctx)
        } else {
            ctx.reply("Недостаточно прав")
        }
    })
}