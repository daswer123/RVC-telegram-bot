import fs from "fs"
import path from "path";
import { deleteFolderContents } from "../functions.js";
import { getAllUsersFromDatabase, getLogsFromDatabase } from "../server/db.js";


const logPath = './config/logs.json';
const sessionsDir = './sessions/';

export const getUserIds = () => {
  return getAllUsersFromDatabase();
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

// Функция getLogs, которая использует getLogsFromDatabase
export const getLogs = () => {
  // Используем функцию getLogsFromDatabase для получения логов
  const logs = getLogsFromDatabase();
  return logs;
};

// Функция для фильтрации логов за последние 24 часа
export const getRecentLogs = (logs) => {
  const now = new Date();

  return logs.filter(log => {
    if (!log.date) return false;
    const logDate = new Date(log.date);
    const diff = now - logDate;
    const diffInHours = diff / 1000 / 60 / 60;
    return diffInHours <= 24;
  });
};

export const countUsersAndModels = (logs) => {
  const userCounts = new Map();
  const modelCounts = new Map();
  const sessionCounts = new Map();

  logs.forEach(log => {
    // Count user
    const userKey = `${log.userId} - ${log.username}`;
    if (userCounts.has(userKey)) {
      userCounts.set(userKey, userCounts.get(userKey) + 1);
    } else {
      userCounts.set(userKey, 1);
    }

    // Count model
    if (log.type === 'transform') {
      if (modelCounts.has(log.extra)) {
        modelCounts.set(log.extra, modelCounts.get(log.extra) + 1);
      } else {
        modelCounts.set(log.extra, 1);
      }
    }

    // Parse session JSON and count session.name
    const session = JSON.parse(log.session);
    if (session && session.name) {
      if (sessionCounts.has(session.name)) {
        sessionCounts.set(session.name, sessionCounts.get(session.name) + 1);
      } else {
        sessionCounts.set(session.name, 1);
      }
    }
  });

  return [userCounts, modelCounts, sessionCounts];
};

export const createLogMessages = (userCounts, modelCounts) => {
  let userCountsMessage = '*Статистика по использованию, среди пользователей за последние 24 часа:*\n\n';
  let modelCountsMessage = '*Статистика по использованию моделей в общем за последние 24 часа:*\n\n';

  [...userCounts.entries()].sort((a, b) => b[1] - a[1]).forEach(([userKey, count]) => {
    userCountsMessage += `*${userKey}* - ${count} преобразований\n`;
  });

  [...modelCounts.entries()].sort((a, b) => b[1] - a[1]).forEach(([modelName, count]) => {
    modelCountsMessage += `*${modelName.slice(0, -1)}* - ${count} раз\n`;
  });

  return [userCountsMessage, modelCountsMessage];
};



export async function sendMessageToAllUsers(message, bot) {
  const userIds = getAllUsersFromDatabase();

  console.log(userIds)

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