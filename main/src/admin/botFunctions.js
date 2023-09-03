import fs from "fs"
import { deleteFolderContents } from "../functions.js";


const path = './config/logs.json';
const sessionsDir = './sessions/';

export const getUserIds = () => {
    return fs.readdirSync(sessionsDir).map(Number);
};

export const clearFolder = (userId) => {
    try {
        deleteFolderContents(sessionsDir + userId);
    } catch (error) {
        console.error(`Не удалось получить информацию о пользователе ${userId}:`, error);
    }
};

export const getUserInfo = async (ctx, userId) => {
    try {
        const chat = await ctx.telegram.getChat(userId);
        const username = chat.username || 'Нет ника';
        return "`" + userId + "`" + ` - ${username}\n`;
    } catch (error) {
        console.error(`Не удалось получить информацию о пользователе ${userId}:`, error);
    }
};

// Функция для чтения и парсинга логов
export const getLogs = () => {
    const data = fs.readFileSync(path, 'utf-8');
    return JSON.parse(data);
  };
  
  // Функция для фильтрации логов за последние 24 часа
export const getRecentLogs = (logs) => {
    const now = new Date();
  
    return logs.filter(log => {
      if(!log.date) return false;
      const logDate = new Date(log.date);
      const diff = now - logDate;
      const diffInHours = diff / 1000 / 60 / 60;
      return diffInHours <= 24;
    });
  };
  
  // Функция для подсчета пользователей и моделей
  export const countUsersAndModels = (logs) => {
    const userCounts = new Map();
    const modelCounts = new Map();
  
    logs.forEach(log => {
      // Count user
      if (userCounts.has(log.uniqueId)) {
        userCounts.set(log.uniqueId, userCounts.get(log.uniqueId) + 1);
      } else {
        userCounts.set(log.uniqueId, 1);
      }
  
      // Count model
      if (log.type === 'transform') {
        if (modelCounts.has(log.extra)) {
          modelCounts.set(log.extra, modelCounts.get(log.extra) + 1);
        } else {
          modelCounts.set(log.extra, 1);
        }
      }
    });
  
    return [userCounts, modelCounts];
  };
  
  // Функция для формирования сообщений
  export const createLogMessages = (userCounts, modelCounts) => {
    let userCountsMessage = '*Статистика по использованию, среди пользователей за последние 24 часа:*\n\n';
    let modelCountsMessage = '*Статистика по использованию моделей в общем за последние 24 часа:*\n\n';
  
    [...userCounts.entries()].sort((a, b) => b[1] - a[1]).forEach(([userId, count]) => {
      userCountsMessage += `*${userId}* - ${count} преобразований\n`;
    });
  
    [...modelCounts.entries()].sort((a, b) => b[1] - a[1]).forEach(([modelName, count]) => {
      modelCountsMessage += `*${modelName.slice(0, -2)}* - ${count} раз\n`;
    });
  
    return [userCountsMessage, modelCountsMessage];
  };


  // Отправить сообщение всем юзерам
export async function sendMessageToAllUsers(message, bot) {
    const sessionsDir = './sessions';
    const userIds = fs.readdirSync(sessionsDir).map(Number);
  
    for (const userId of userIds) {
      try {
        await bot.telegram.sendMessage(userId, message);
      } catch (error) {
        // Если пользователь заблокировал бота, пропустить и продолжить со следующим пользователем
        if (error.code === 403) {
          console.log(`Пользователь ${userId} заблокировал бота. Пропускаем.`);
          continue;
        }
        // Вывести ошибку для всех других случаев
        console.error(`Не удалось отправить сообщение пользователю ${userId}:`, error);
      }
    }
  }
  
  // Отправить сообщение определённому пользователю
  export async function sendMessageToUser(userId, message, bot) {
    try {
      await bot.telegram.sendMessage(userId, message);
    } catch (error) {
      // Если пользователь заблокировал бота, выводим сообщение об ошибке
      if (error.code === 403) {
        console.log(`Пользователь ${userId} заблокировал бота.`);
      } else {
        // Выводим ошибку для всех других случаев
        console.error(`Не удалось отправить сообщение пользователю ${userId}:`, error);
      }
    }
  }


  // Записывает ID пользователя в файл ban.json
export function banUser(userId) {
    const path = './config/ban.json';
    // Прочитать текущий список забаненных пользователей
    let bannedUsers = [];
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path, 'utf-8');
      bannedUsers = JSON.parse(data);
    }
  
    // Добавить нового пользователя, если он еще не забанен
    if (!bannedUsers.includes(userId)) {
      bannedUsers.push(userId);
      fs.writeFileSync(path, JSON.stringify(bannedUsers, null, 2));
    }
  }
  
  // Удаляет ID пользователя из файла ban.json
  export function unbanUser(userId) {
    const path = './config/ban.json';
    // Прочитать текущий список забаненных пользователей
    let bannedUsers = [];
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path, 'utf-8');
      bannedUsers = JSON.parse(data);
    }
  
    // Убрать пользователя, если он забанен
    const index = bannedUsers.indexOf(userId);
    if (index !== -1) {
      bannedUsers.splice(index, 1);
      fs.writeFileSync(path, JSON.stringify(bannedUsers, null, 2));
    }
  }
  
  // Возвращает массив с ID всех забаненных пользователей
  export function getBannedUsers() {
    const path = './config/ban.json';
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path, 'utf-8');
      return JSON.parse(data);
    }
    // Возвращаем пустой массив, если файл не существует
    return [];
  }