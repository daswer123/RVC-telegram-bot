import Database from 'better-sqlite3';

// Подключиться к базе данных SQLite
let db = new Database('users.db', { fileMustExist: false });
console.log('Connected to the test SQLite database.');

// Создать таблицу presets, если она не существует
db.exec('CREATE TABLE IF NOT EXISTS presets(userId TEXT, presetName TEXT, presetData TEXT, PRIMARY KEY(userId, presetName))');
console.log('Presets table ready.');

// Создать таблицу sessions, если она не существует
db.exec('CREATE TABLE IF NOT EXISTS sessions(id text PRIMARY KEY, session text)');
console.log('Session table ready.');

// Создать таблицу suggestions
db.exec(`
  CREATE TABLE IF NOT EXISTS suggestions(username TEXT,date TEXT,suggestion TEXT)`);
console.log('Suggestions table ready.');

// Создать таблицу train_models
db.exec(`
  CREATE TABLE IF NOT EXISTS train_models(username TEXT,id TEXT,modelName TEXT,description TEXT,date TEXT)`);
console.log('Train models table ready.');

// Создать таблицу ban
db.exec('CREATE TABLE IF NOT EXISTS ban(userId TEXT)');
console.log('Ban table ready.');

// Создать таблицу users, если она не существует
db.exec('CREATE TABLE IF NOT EXISTS users(userId TEXT PRIMARY KEY, username TEXT, status TEXT DEFAULT "default")');
console.log('Users table ready.');

// Создать таблицу operations
db.exec(`
  CREATE TABLE IF NOT EXISTS operations(
    operationId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    operationType TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userId)
  )
`);
console.log('Operations table ready.');
export default db

// Создать таблицу logs
db.exec(`
  CREATE TABLE IF NOT EXISTS logs(
    logId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    username TEXT,
    session TEXT,
    type TEXT,
    extra TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP)
`);
console.log('Logs table ready.');

// Функция для добавления операции в базу данных
export function addOperationToDatabase(userId, operationType) {
    userId = Math.floor(userId);
    const stmt = db.prepare('INSERT INTO operations(userId, operationType) VALUES(?, ?)');
    const info = stmt.run(userId, operationType);
    return info.lastInsertRowid;
}

// Функция для удаления операции из базы данных
export function deleteOperationFromDatabase(operationId) {
    operationId = Math.floor(operationId);
    db.prepare('DELETE FROM operations WHERE operationId = ?').run(operationId);
}

// Функция для получения всех операций пользователя из базы данных
export function getOperationsFromDatabase(userId) {
    userId = Math.floor(userId);
    const rows = db.prepare('SELECT operationId, operationType FROM operations WHERE userId = ?').all(userId);
    // Возвращает объекты операций в виде массива
    return rows.map(row => {
        return {
            operationId: row.operationId,
            operationType: row.operationType
        }
    });
}

export function getUserOperationsCountFromDatabase(userId, operationType) {
    userId = Math.floor(userId);
    // Получить количество операций пользователя из базы данных
    const operationCount = db.prepare('SELECT COUNT(*) as count FROM operations WHERE userId = ? AND operationType = ?').get(userId, operationType).count;
    return operationCount;
}

export function getUserOperationsFromDatabase(userId) {
    userId = Math.floor(userId);
    // Получить все операции пользователя из базы данных
    const operations = db.prepare('SELECT operationId, operationType, timestamp FROM operations WHERE userId = ? ORDER BY timestamp').all(userId);
    return operations;
}

export function getUserCurrentOperationsCountFromDatabase(userId, operationType) {
    userId = Math.floor(userId);
    // Получить количество операций пользователя из базы данных
    const operationCount = db.prepare('SELECT COUNT(*) as count FROM operations WHERE userId = ? AND operationType = ?').get(userId, operationType).count;
    return operationCount;
}

export function getAllOperationsFromDatabase() {
    // Получить все операции из базы данных
    const operations = db.prepare('SELECT operationId, operationType, timestamp, userId FROM operations ORDER BY operationId').all();
    return operations;
}

export function clearOperationsDatabase() {
    // Выполнить SQL-запрос для удаления всех записей из таблицы operations
    const info = db.prepare('DELETE FROM operations').run();
    console.log(`Deleted ${info.changes} rows from the operations table.`);
}

export function getSessionFromDatabase(userId) {
    userId = Math.floor(userId);
    const row = db.prepare('SELECT session FROM sessions WHERE id = ?').get(userId);
    return row ? JSON.parse(row.session) : null;
}

export function saveSessionToDatabase(userId, session) {
    userId = Math.floor(userId);
    db.prepare('INSERT OR REPLACE INTO sessions(id, session) VALUES(?, ?)').run(userId, JSON.stringify(session));
}

// Функция для получения всех названий пресетов пользователя из базы данных
export function getPresetsFromDatabase(userId) {
    userId = Math.floor(userId);
    const rows = db.prepare('SELECT presetName FROM presets WHERE userId = ?').all(userId);
    // Извлекаем названия пресетов из каждой строки и возвращаем их в виде массива
    const presetNames = rows.map(row => row.presetName);
    console.log(presetNames)
    return presetNames;
}

// Функция для обновления значений пресета в базе данных
export function updatePresetInDatabase(userId, presetName, model_path, index_path, name) {
    userId = Math.floor(userId);
    // Получаем текущие данные пресета
    let presetData = getPresetFromDatabase(userId, presetName);
    if (!presetData) {
        console.error(`Preset with name ${presetName} not found for user ${userId}`);
        return;
    }
    // Обновляем значения в данных пресета
    presetData.model_path = model_path;
    presetData.index_path = index_path;
    presetData.name = name;
    // Сохраняем обновленные данные пресета обратно в базу данных
    savePresetsToDatabase(userId, presetName, presetData);
}

// Функция для получения пресета из базы данных
export function getPresetFromDatabase(userId, presetName) {
    userId = Math.floor(userId);
    const row = db.prepare('SELECT presetData FROM presets WHERE userId = ? AND presetName = ?').get(userId, presetName);
    return row ? JSON.parse(row.presetData) : null;
}

// Функция для сохранения пресета в базу данных
export function savePresetsToDatabase(userId, presetName, presetData) {
    userId = Math.floor(userId);
    db.prepare('INSERT OR REPLACE INTO presets(userId, presetName, presetData) VALUES(?, ?, ?)').run(userId, presetName, JSON.stringify(presetData));
}

// Функция для удаления пресета из базы данных
export function deletePresetFromDatabase(userId, presetName) {
    userId = Math.floor(userId);
    db.prepare('DELETE FROM presets WHERE userId = ? AND presetName = ?').run(userId, presetName);
}


// Функия для сохранения предложений по улучшению
export function saveSuggestiontoDataBase(username, suggestion) {
    const date = new Date().toISOString();
    const sql = `INSERT INTO suggestions(username, date, suggestion) VALUES(?, ?, ?)`;
    try {
        db.prepare(sql).run(username, date, suggestion);
        console.log(`Suggestion from ${username} has been saved.`);
    } catch (err) {
        console.error(`An error occurred while saving the suggestion from ${username}.`);
        throw err;
    }
}

export function saveTrainModelInfoToDB(ctx) {
    const newEntry = {
        username: ctx.from.username,
        id: Math.floor(ctx.from.id),
        modelName: ctx.session.voiceModelName,
        description: ctx.session.voiceModelDesc,
        date: new Date().toISOString()
    };

    try {
        db.prepare('INSERT INTO train_models(username, id, modelName,description, date) VALUES(?, ?, ?, ? , ?)')
            .run(newEntry.username, newEntry.id, newEntry.modelName, newEntry.description, newEntry.date);
    } catch (err) {
        throw err;
    }
}

export function getTrainModelsFromDatabase() {
    const rows = db.prepare('SELECT * FROM train_models ORDER BY date ASC').all();
    return rows;
}

export function removeTrainModelFromDatabase(id, date) {
    id = Math.floor(id);
    db.prepare('DELETE FROM train_models WHERE id = ? AND date = ?').run(id, date);
}

export function banUser(userId) {
    userId = Math.floor(userId);
    try {
        db.prepare(`INSERT OR IGNORE INTO ban (userId) VALUES (?)`).run(userId);
    } catch (err) {
        throw err;
    }
}

export function unbanUser(userId) {
    userId = Math.floor(userId);
    try {
        db.prepare(`DELETE FROM ban WHERE userId = ?`).run(userId);
    } catch (err) {
        throw err;
    }
}

export function getBannedUsersFromDB() {
    const rows = db.prepare(`SELECT userId FROM ban`).all();
    return rows.map(row => row.userId);
}

// Функция для получения пользователя из базы данных
export function getUserFromDatabase(userId) {
    userId = Math.floor(userId);
    const row = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId);
    return row ? row : null;
}

// Функция для сохранения пользователя в базу данных
export function saveUserToDatabase(userId, username) {
    userId = Math.floor(userId);
    db.prepare('INSERT OR REPLACE INTO users(userId, username) VALUES(?, ?)').run(userId, username);
}

// Функция для удаления пользователя из базы данных
export function deleteUserFromDatabase(userId) {
    userId = Math.floor(userId);
    db.prepare('DELETE FROM users WHERE userId = ?').run(userId);
}

// Функция для обновления статуса пользователя в базе данных
export function updateUserStatusInDatabase(userId, status) {
    userId = Math.floor(userId);
    db.prepare('UPDATE users SET status = ? WHERE userId = ?').run(status, userId);
}

// Функция для получения пользователя из базы данных по имени пользователя
export function getUserByUsernameFromDatabase(username) {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    return row ? row : null;
}

export function getAllUsersFromDatabase() {
    const rows = db.prepare('SELECT userId FROM users').all();
    return rows ? rows.map(row => row.userId) : [];
}

// Функция для добавления записи в таблицу logs
export function addLogToDatabase(userId, username, session, type, extra) {
    console.log(`userId: ${userId}, username: ${username}, session: ${session}, type: ${type}, extra: ${extra}`); // Добавлено для отладки
    const stmt = db.prepare('INSERT INTO logs(userId, username, session, type, extra) VALUES(?, ?, ?, ?, ?)');
    const info = stmt.run(userId, username, session, type, extra);
    return info.lastInsertRowid;
}

// Функция для удаления записи из таблицы logs
export function deleteLogFromDatabase(logId) {
    db.prepare('DELETE FROM logs WHERE logId = ?').run(logId);
}

// Функция для получения всех записей пользователя из таблицы logs
export function getCurrentLogsFromDatabase(userId) {
    const rows = db.prepare('SELECT * FROM logs WHERE userId = ?').all(userId);
    // Возвращает объекты записей в виде массива
    return rows.map(row => {
        return {
            logId: row.logId,
            userId: row.userId,
            username: row.username,
            session: row.session,
            type: row.type,
            extra: row.extra,
            date: row.date
        }
    });
}

// Функция для получения всех записей из таблицы logs
export function getLogsFromDatabase() {
    const rows = db.prepare('SELECT * FROM logs').all();
    // Возвращает объекты записей в виде массива
    return rows ? rows.map(row => {
        return {
            logId: row.logId,
            userId: row.userId,
            username: row.username,
            session: row.session,
            type: row.type,
            extra: row.extra,
            date: row.date
        }
    }) : [];
}