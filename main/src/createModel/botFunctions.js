import fs from "fs"
import path from "path"

export function createVoiceFolder(uniqueId, folderName) {
    let voicePath = `train_voice/${uniqueId}/${folderName}`;
  
    // создаем папку сессии, если она еще не существует
    if (!fs.existsSync(voicePath)) {
      fs.mkdirSync(voicePath, { recursive: true });
    }
    return voicePath
  }
  
  export function writeDescriptionFile(voicePath, session) {
    // создаем и записываем файл
    const filePath = path.join(voicePath, 'desc.txt');
    const fileContent = `${session.voiceModelName}\n${session.voiceModelDesc}\n${session.voiceModelGender}`;
    fs.writeFileSync(filePath, fileContent);
  }
  
  export function writeJsonFile(ctx) {
    // создаем объект для JSON файла
    const newEntry = {
      username: ctx.from.username,
      id: ctx.from.id,
      modelName: ctx.session.voiceModelName,
      date: new Date().toISOString()
    };
  
    const jsonFilePath = path.join('waitForModel.json');
  
    // сначала проверяем, существует ли файл
    if (fs.existsSync(jsonFilePath)) {
      // если файл существует, читаем его содержимое
      const fileContent = fs.readFileSync(jsonFilePath);
  
      // преобразуем содержимое файла в объект JavaScript
      const entries = JSON.parse(fileContent);
  
      // добавляем новый элемент в список
      entries.push(newEntry);
  
      // записываем измененный список обратно в файл
      fs.writeFileSync(jsonFilePath, JSON.stringify(entries, null, 2));
    } else {
      // если файл не существует, просто записываем новый элемент в файл
      fs.writeFileSync(jsonFilePath, JSON.stringify([newEntry], null, 2));
    }
  }
  
  export function resetSession(session) {
    session.voiceModelName = ""
    session.voiceModelDesc = ""
    session.voiceModelGender = ""
  }
  