import fs from "fs"
import path from "path";
import { deleteFolderContents } from "../functions.js";


const logPath = './config/logs.json';
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
    const data = fs.readFileSync(logPath, 'utf-8');
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
    const banPath = './config/ban.json';
    // Прочитать текущий список забаненных пользователей
    let bannedUsers = [];
    if (fs.existsSync(banPath)) {
      const data = fs.readFileSync(banPath, 'utf-8');
      bannedUsers = JSON.parse(data);
    }
  
    // Добавить нового пользователя, если он еще не забанен
    if (!bannedUsers.includes(userId)) {
      bannedUsers.push(userId);
      fs.writeFileSync(banPath, JSON.stringify(bannedUsers, null, 2));
    }
  }
  
  // Удаляет ID пользователя из файла ban.json
  export function unbanUser(userId) {
    const banPath = './config/ban.json';
    // Прочитать текущий список забаненных пользователей
    let bannedUsers = [];
    if (fs.existsSync(banPath)) {
      const data = fs.readFileSync(banPath, 'utf-8');
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
    const banPath = './config/ban.json';
    if (fs.existsSync(banPath)) {
      const data = fs.readFileSync(banPath, 'utf-8');
      return JSON.parse(data);
    }
    // Возвращаем пустой массив, если файл не существует
    return [];
  }


  export async function removeFromJsonFile(userId, date) {
    const jsonFilePath = path.join('waitForModel.json');
  
    // сначала проверяем, существует ли файл
    if (fs.existsSync(jsonFilePath)) {
      // если файл существует, читаем его содержимое
      const fileContent = await fs.readFileSync(jsonFilePath);
      // преобразуем содержимое файла в объект JavaScript
      const entries = JSON.parse(fileContent);
  
      // удаляем запись пользователя
      console.log(date,userId)
      const updatedEntries = entries.filter(entry => !(entry.id === userId && entry.date === date));
  
      // записываем обновленный список обратно в файл
      fs.writeFileSync(jsonFilePath, JSON.stringify(updatedEntries, null, 2));
    }
}


 export async function readJsonFile() {
    const jsonFilePath = path.join('waitForModel.json');
    if (fs.existsSync(jsonFilePath)) {
      const fileContent = fs.readFileSync(jsonFilePath);
      const entries = JSON.parse(fileContent);
      // Проверяем, являются ли записи массивом
      if (Array.isArray(entries)) {
        return entries;
      } else {
        console.log('File content is not an array');
        return [];
      }
    }
    console.log('File does not exist');
    return [];
  }