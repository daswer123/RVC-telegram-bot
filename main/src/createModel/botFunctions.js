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

export function resetSession(session) {
  session.voiceModelName = ""
  session.voiceModelDesc = ""
  session.voiceModelGender = ""
}
