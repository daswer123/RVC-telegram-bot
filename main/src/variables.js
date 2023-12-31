// constants.js
import fs from "fs";
import config from "config"

export const characters = JSON.parse(fs.readFileSync(config.get("CHARACTER_PATH") + "\\characters.json"));

const {
  model_path,
  index_path,
  char_photo,
  name,
  gender,
} = characters[0]

const pith = gender === "male" ? 0 : gender === "female" ? 12 : 6;

export const INITIAL_SESSION = {
  loadConfig: {},
  isAvalible: true,
  // Text and Settigs wait handlers
  settingPith: false,
  // isSettingChange: false,
  settingMangioCrepeHop: false,
  settingFeatureRatio: false,
  settingProtectVoiceless: false,
  waitingForCover: false,
  settingVocalVolume: false,
  waitForPredlog: false,
  settingInstrumentVolume: false,
  settingVoiceSpeed: false,
  waitForPresetSave: false,
  waitForSeparate: false,
  waitForSeparatev2: false,
  waitForSeparatev3: false,
  waitForSeparate6Items: false,
  waitForSeparate4Items: false,
  waitForSeparateInst: false,
  waitForVoice: false,
  waitForModelName: false,
  waitForModelDesc: false,
  waitForModelGender: false,
  waitForMinPich: false,
  waitForMaxPich: false,
  waitForEchoDelay: false,
  // Effect handler text
  waitForEchoPower: false,
  waitForReverb: false,
  waitForAutotuneAttack: false,
  waitForAutotuneStr: false,
  waitForAutotuneNote: false,
  waitForCompressorThreshold: false,
  waitForCompressorRatio: false,
  waitForChorusRate: false,
  waitForChorusDepth: false,
  waitForReverbRoom: false,
  waitForReverbWet: false,
  waitForDelayTime: false,
  waitForDelayMix: false,
  waitForHighpass: false,
  waitForLowpass: false,
  waitForHighpass: false,
  waitForNoiseGateThreshold: false,
  waitForPitchShift: false,
  // Effect settings
  // echoDelay: 0.3,
  // echoPower: 0.1,
  // reverbPower: 0.0005,
  autotune_attack: 0.1,
  autotune_strength: 0.9,
  autotune_mode: "auto",
  autotune_note: "C",
  autotune_scale: "major",
  compressorThreshold: -20,
  compressorRatio: 4,
  highpassCutoff: 100,
  lowpassCutoff: 5000,
  noiseGateThreshold: -100,
  chorusRate: 1,
  chorusDepth: 0.25,
  reverbRoomSize: 0.5,
  reverbWetLevel: 0.3,
  delayTime: 0.5,
  delayMix: 0.5,
  pitchShift: 0,
  // Effects
  chorusOn: false,
  reverbOn: false,
  delayOn: false,
  pitchShiftOn: false,
  noiseGateOn: false,
  highPassOn: false,
  lowPassOn: false,
  compressorOn: false,
  noiseGateOn: false,
  phoneEffect: false,
  // Autotune
  autoTune: false,
  neuroAutoTune: false,
  // Other
  minPich: 50,
  maxPich: 1100,
  removeInstrument: "",
  voiceModelName: "",
  voiceModelDesc: "",
  voiceModelGender: "",
  voiceOrAudioOut: "audio",
  mergeAudio: false,
  testVoice: false,
  firstFile: null,
  secondFile: null,
  previousMessageId: null,
  voiceActor: "aidar",
  audioProcessPower: "nothing",
  pith,
  method: "rmvpe",
  mangio_crepe_hop: 128,
  feature_ratio: 0.8,
  protect_voiceless: 0.33,
  voice_volume: 1.6,
  instrumnet_volume: 0.6,
  voice_speed: 0.95,
  model_path,
  index_path,
  char_photo,
  audioSample: "",
  name,
  gender,
  voice_preset: "male",
  inDatabase: false
};

// DEFAULT Settings value 
export const settingsConfig = {
  settingPith: {
    name: "Pith",
    minValue: -24,
    maxValue: 24,
  },
  settingMangioCrepeHop: {
    name: "Mangio Crepe Hop",
    minValue: 64,
    maxValue: 250,
  },
  settingFeatureRatio: {
    name: "Feature Ratio",
    minValue: 0,
    maxValue: 1,
  },
  settingProtectVoiceless: {
    name: "Protect Voiceless",
    minValue: 0,
    maxValue: 0.5,
  },
  settingVocalVolume: {
    name: "Voice volume",
    minValue: 0,
    maxValue: 3,
  },
  settingInstrumentVolume: {
    name: "Instrumnet volume",
    minValue: 0,
    maxValue: 3,
  },
  settingVoiceSpeed: {
    name: "Voice Speed",
    minValue: 0.2,
    maxValue: 1.5,
  },
};


// TTS VOICE
export const VOICES = [
  { name: "Aidar", id: "aidar" },
  { name: "Baya", id: "baya" },
  { name: "Kseniya", id: "kseniya" },
  { name: "Xenia", id: "xenia" },
  { name: "Eugene", id: "eugene" },
  { name: "Levitan", id: "yandex_levitan" },
  { name: "Zahar", id: "yandex_zahar" },
  { name: "Silaerkan", id: "yandex_silaerkan" },
  { name: "Oksana", id: "yandex_oksana" },
  { name: "Jane", id: "yandex_jane" },
  { name: "Omazh", id: "yandex_omazh" },
  { name: "Kolya", id: "yandex_kolya" },
  { name: "Kostya", id: "yandex_kostya" },
  { name: "Nastya", id: "yandex_nastya" },
  { name: "Sasha", id: "yandex_sasha" },
  { name: "Nick", id: "yandex_nick" },
  { name: "Zhenya", id: "yandex_zhenya" },
  { name: "Tanya", id: "yandex_tanya" },
  { name: "Ermilov", id: "yandex_ermilov" },
  { name: "Alyss", id: "yandex_alyss" },
  { name: "Ermil with Tunning", id: "yandex_ermil_with_tunning" },
  { name: "Robot", id: "yandex_robot" },
  { name: "Dude", id: "yandex_dude" },
  { name: "Zombie", id: "yandex_zombie" },
  { name: "Smoky", id: "yandex_smoky" },
];

export const MALE_VOICES = [
  { name: "Aidar", id: "aidar" },
  { name: "Eugene", id: "eugene" },
  { name: "Levitan", id: "yandex_levitan" },
  { name: "Zahar", id: "yandex_zahar" },
  { name: "Silaerkan", id: "yandex_silaerkan" },
  { name: "Kolya", id: "yandex_kolya" },
  { name: "Kostya", id: "yandex_kostya" },
  { name: "Nick", id: "yandex_nick" },
  { name: "Ermilov", id: "yandex_ermilov" },
  { name: "Ermil with Tunning", id: "yandex_ermil_with_tunning" },
  { name: "Robot", id: "yandex_robot" },
  { name: "Dude", id: "yandex_dude" },
  { name: "Zombie", id: "yandex_zombie" },
  { name: "Smoky", id: "yandex_smoky" },
];

export const FEMALE_VOICES = [
  { name: "Baya", id: "baya" },
  { name: "Kseniya", id: "kseniya" },
  { name: "Xenia", id: "xenia" },
  { name: "Oksana", id: "yandex_oksana" },
  { name: "Jane", id: "yandex_jane" },
  { name: "Nastya", id: "yandex_nastya" },
  { name: "Sasha", id: "yandex_sasha" },
  { name: "Zhenya", id: "yandex_zhenya" },
  { name: "Tanya", id: "yandex_tanya" },
  { name: "Alyss", id: "yandex_alyss" },
];

export const transfromAudioMaxQueue = 99
export const handleAICoverMaxQueue = 99
export const separateAudioMaxQueue = 99