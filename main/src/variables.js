// constants.js
import fs from "fs";
import config from "config"

export const characters = JSON.parse(fs.readFileSync(config.get("CHARACTER_PATH") +"\\characters.json"));

const { 
  model_path, 
  index_path, 
  char_photo, 
  name, 
  gender, 
} = characters[0]

const pith = gender === "male" ? 0 : gender === "female" ? 12 : 6;

export const INITIAL_SESSION = {
    settingPith: false,
    settingMangioCrepeHop: false,
    settingFeatureRatio: false,
    settingProtectVoiceless: false,
    waitingForCover: false,
    settingVocalVolume: false,
    settingInstrumentVolume: false,
    mergeAudio: false,
    testVoice: false,
    firstFile: null,
    secondFile: null,
    previousMessageId : null,
    pith,
    method: "mangio-crepe",
    mangioCrepeHop: 128,
    featureRatio: 0.8,
    protectVoiceless: 0.33,
    voice_volume: 1.3,
    instrumnet_volume: 0.6,
    model_path,
    index_path,
    char_photo,
    audioSample: "",
    name,
    gender,
    voice_preset : "male"
  };
