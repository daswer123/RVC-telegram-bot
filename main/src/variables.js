// constants.js
import fs from "fs";

export const INITIAL_SESSION = {
    settingPith: false,
    settingMangioCrepeHop: false,
    settingFeatureRatio: false,
    settingProtectVoiceless: false,
    pith: 12,
    method: "crepe",
    mangioCrepeHop: 128,
    featureRatio: 0.5,
    protectVoiceless: 0.33,
    model_path : "E:\\Dev\\transfer_rvc_voice\\MODELS\\alica\\alica_zayac.pth",
    index_path : "E:\\Dev\\transfer_rvc_voice\\MODELS\\alica\\alica_index.index",
    char_photo : "E:\\Dev\\transfer_rvc_voice\\MODELS\\alica\\alica.jpg",
    name : "Alica",
    gender: "female",
    voice_preset: "male"
  };

export const characters = JSON.parse(fs.readFileSync("E:\\Dev\\transfer_rvc_voice\\main\\src\\characters.json"));