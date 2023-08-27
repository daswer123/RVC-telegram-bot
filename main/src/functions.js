import axios from 'axios';
import path from 'path';
import fs from 'fs';
import fspr from "fs/promises"
import { PythonShell } from 'python-shell';
import config from "config";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import pkg from 'number-to-words-ru';
import { promisify } from 'util';
import { Semaphore } from './botFunction.js'; 


const { convert: convertNumberToWordsRu } = pkg;
// const semaphore = new Semaphore(1);
// const semaphore_for_sep = new Semaphore(1);
// const semaphore_for_voice = new Semaphore(1);

let semaphore,semaphore_for_sep, semaphore_for_voice;

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

export const getRandomFileContent = async () => {
  const folderPath = path.resolve('./text');
  const files = await readdir(folderPath);
  const textFiles = files.filter(file => path.extname(file) === '.txt');

  if (textFiles.length === 0) return 'No text files found';

  const randomFile = textFiles[Math.floor(Math.random() * textFiles.length)];
  const content = await readFile(path.join(folderPath, randomFile), 'utf-8');

  return content;
};

async function readNumbersFromJson() {
  const path = './config/power.json';
  let json;
  if (fs.existsSync(path)) {
      const data = fs.readFileSync(path, 'utf-8');
      json = JSON.parse(data);
  } else {
      json = {
          "transform" : "1",
          "silero" : "1",
          "separate" : "1"
      };
      fs.writeFileSync(path, JSON.stringify(json), 'utf-8');
  }

  return [Number(json.transform), Number(json.silero), Number(json.separate)];
}

// Указываем путь к ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

function transliterate(word) {
  const answer = [];
  const converter = {
    'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'z': 'з',
    'i': 'и', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п',
    'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'h': 'х', 'c': 'к'
  };

  for (let i = 0; i < word.length; i++) {
    answer.push(converter[word[i]] || word[i]);
  }

  return answer.join('');
}

function replaceLatinCharacters(text) {
  return text.replace(/[a-z]+/gi, function (word) {
    return transliterate(word.toLowerCase());
  });
}

function numbersToWords(text) {
  return text.replace(/\d+/g, function (number) {
    const options = {
      currency: 'number',
      convertNumberToWords: { integer: true, fractional: false },
      showCurrency: { integer: false, fractional: false }
    };
    return ', ' + convertNumberToWordsRu(number, options) + ',';
  });
}

function processText(text) {
  text = replaceLatinCharacters(text);
  text = numbersToWords(text);
  return text;
}

const extractAudio = (filePath, output) => {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .output(output)
      .noVideo()
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};

const extractVideo = (filePath, output) => {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .output(output)
      .noAudio()
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};

export const splitVideoAndAudio = async (filePath, sessionPath) => {
  const audioOutput = `${sessionPath}/audio.mp3`;
  const videoOutput = `${sessionPath}/video_empty.mp4`;

  await Promise.all([
    extractAudio(filePath, audioOutput),
    extractVideo(filePath, videoOutput),
  ]);

  // fs.unlink(filePath, (err) => {
  //   if (err) console.error(`Error deleting file: ${err}`);
  // });

  return [videoOutput, audioOutput];
};

export const mergeAudioAndVideo = (videoPath, audioPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .videoCodec('copy')
      .input(audioPath)
      .audioCodec('copy')
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};


export const mergeAudioFilesToMp3 = (vocalFile, instrumentalFile, outputFile, ctx) => {


  const vocalVolume = ctx.session.voice_volume || 1.3 // Увеличиваем громкость вокала на 20%
  const instrumentalVolume = ctx.session.instrumnet_volume || 0.7; // Уменьшаем громкость фоновой музыки на 20%

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(instrumentalFile)
      .input(vocalFile)
      .complexFilter(
        `[0:a]volume=${instrumentalVolume}[instrumental];` +
        `[1:a]volume=${vocalVolume}[vocal];` +
        `[instrumental]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[instrumentalFormatted];` + // Добавляем фильтр aformat для фоновой музыки
        `[vocal]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[vocalFormatted];` + // Добавляем фильтр aformat для вокала
        `[instrumentalFormatted][vocalFormatted]amerge=inputs=2[a]`,
        ['a']
      )
      .outputOption('-ac', '2') // Устанавливаем количество аудиоканалов на 2 (стерео)
      .on('error', (err) => {
        reject(err);
      })
      .on('end', () => {
        resolve();
      })
      .save(outputFile);
  });
};


async function convertWavToMp3(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .output(outputFile)
      .audioCodec('libmp3lame')
      .outputOptions('-y') // Добавьте эту строку для перезаписи существующего файла
      .on('end', () => {
        console.log('Конвертация завершена');
        resolve(outputFile);
      })
      .on('error', (err) => {
        console.error('Ошибка конвертации:', err.message);
        reject(err);
      })
      .run();
  });
}

export async function compressMp3(inputFile, outputFile = null, quality = 2) {
  // Если выходной файл не указан, используем "input"_cut.mp3
  if (outputFile === null) {
    const inputFileWithoutExtension = inputFile.slice(0, inputFile.lastIndexOf('.'));
    outputFile = `${inputFileWithoutExtension}_cut.mp3`;
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .output(outputFile)
      .audioCodec('libmp3lame')
      .audioQuality(quality)
      .outputOptions('-y')
      .on('end', () => {
        console.log('Сжатие завершено');
        resolve(outputFile);
      })
      .on('error', (err) => {
        console.error('Ошибка сжатия:', err.message);
        reject(err);
      })
      .run();
  });
}

let options;

export const getVocalFilePath = async (searchDirectory) => {
  try {
    const files = await fspr.readdir(searchDirectory);
    for (const file of files) {
      if (file.includes('(Vocals)')) {
        return path.join(searchDirectory, file);
      }
    }
    throw new Error('No file with "(Vocals)" found in the directory.');
  } catch (err) {
    throw err;
  }
};

export const getInstrumentalFilePath = async (searchDirectory, sufix = "Kim_Vocal_2") => {
  try {
    const files = await fspr.readdir(searchDirectory);
    for (const file of files) {
      if (file.includes(`(Instrumental)_${sufix}`)) {
        return path.join(searchDirectory, file);
      }
    }
    throw new Error('No file with "(Instrumental)" found in the directory.');
  } catch (err) {
    throw err;
  }
};

export const improveAudio = async (ctx, sessionPath,filename) => {
  let mp3Path = `${sessionPath}/${filename}`;

  let string;

  if(ctx.session.echoOn){
    string = "--echo"
}

if(ctx.session.reverbOn){
    string = "--reverb"
}

if(ctx.session.reverbOn && ctx.session.echoOn){
    string = "--all"
}

let optionss = {
    mode: 'text',
    pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
    pythonOptions: ['-u'], // get print results in real-time
    scriptPath: config.get("AUDIO_SEP_PATH"),
    args: [
        mp3Path,
        `${sessionPath}/audio_out_improve.mp3`,
        string,
    ]
};

if(ctx.session.echoOn){
    optionss.args.push('--echo-delay');
    optionss.args.push(ctx.session.echoDelay || 0.3);
    optionss.args.push('--echo-attenuation');
    optionss.args.push(ctx.session.echoPower || 0.1);
}

    if(ctx.session.reverbOn){
        optionss.args.push('--reverb-ratio');
        optionss.args.push(ctx.session.reverbPower || 0.0005);
    }

    const messages = await PythonShell.run('effects.py', optionss)
    return messages

}

export const autotuneAudio = async (ctx, sessionPath,filename) => {
  let mp3Path = `${sessionPath}/${filename}`;
  let instrumentPath = `${sessionPath}/instrumental.mp3`;

  const attack = ctx.session.autotune_attack
  const strength = ctx.session.autotune_strength

    let optionss = {
      mode: 'text',
      pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: config.get("AUDIO_SEP_PATH"),
      args: [
        instrumentPath,
        mp3Path,
        `${sessionPath}/autotune_vocal.mp3`,
        attack,
        strength
      ]
    };

    const messages = await PythonShell.run('autotune.py', optionss)
    return messages

}


export const transformAudio = async (ctx, sessionPath, audioPath = "", setMp3 = false, ctxx ="") => {
  // Acquire semaphore before doing any work
  const [semaphorePower,_,__] = await readNumbersFromJson()
  semaphore = new Semaphore(semaphorePower);
  await semaphore.acquire();

  // Ensure semaphore is released, even if there is an error
  try {
    const tg_options = ctx.session
    const method = tg_options.method;
    const index_ratio = tg_options.feature_ratio;
    const protect_voice = tg_options.protect_voiceless;
    const pith = tg_options.pith;
    const mangio_crepe_hop = tg_options.mangio_crepe_hop;

    let minPich = Number(tg_options.minPich);
    let maxPich = Number(tg_options.maxPich);

    if(isNaN(minPich)) minPich = 50
    if(isNaN(maxPich)) maxPich = 1100

    let neuroAutoTune = tg_options.neuroAutoTune

    if(neuroAutoTune === undefined){
      neuroAutoTune = false
    }

    // console.log(index_ratio)
    const model_path = tg_options.model_path;
    let model_index = tg_options.index_path;

    if (model_index === undefined) {
      model_index = ""
    }

    let outOggPath = `${sessionPath}/audio_out.ogg`;

    let mp3Path = `${sessionPath}/audio_out.mp3`;

    let outpath;

    // console.log(tg_options, sessionPath);

    if (audioPath === "") {
      audioPath = `${sessionPath}/audio.ogg`;
    }

    if (setMp3) {
      outpath = mp3Path;
    } else {
      outpath = outOggPath;
    }

    console.log(neuroAutoTune)

    options = {
      mode: 'text',
      pythonPath: config.get("PYTHON_VENV_PATH"),
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: config.get("RVC_SCRIPT_PATH"),
      args: [
        pith,
        audioPath,
        model_index,
        method,
        outpath,
        model_path,
        index_ratio,
        "cuda:0",
        "True",
        "3",
        "0",
        "1",
        protect_voice,
        mangio_crepe_hop,
        minPich,
        maxPich,
        neuroAutoTune
      ]
    };

    console.log(options.args,sessionPath)

    const messages = await PythonShell.run('test-infer.py', options);
    console.log("Файл успешно преобразован");

    logUserSession(ctx,"transform",ctx.session.name)

    if (setMp3) {
      await compressMp3(mp3Path);
      console.log("Файл успешно cжат");
    }
  } catch (err) {
    console.error(err);
  } finally {
    // Always release the semaphore
    semaphore.release();
  }
};

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

export async function deleteFolderContents(directory) {
  fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
          let fullPath = path.join(directory, file);
          fs.stat(fullPath, (err, stat) => {
              if (err) throw err;

              if (stat.isDirectory()) {
                  // recursive delete if the file is a directory
                  fs.rm(fullPath, { recursive: true, force: true }, (err) => {
                      if (err) throw err;
                  });
              } else {
                  // delete file only if the file is not 'presets.json'
                  if (file !== 'presets.json') {
                      fs.unlink(fullPath, (err) => {
                          if (err) throw err;
                      });
                  }
              }
          });
      }
  });
}



export function logUserSession(ctx,type,extra = "") {
  const path = './config/logs.json';
    const uniqueId = ctx.from.id;
    const date = new Date().toISOString();
    
    const log = {
        uniqueId,
        type,
        extra,
        date
    };

    let logsArray = [];
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path, 'utf-8');
        logsArray = JSON.parse(data);
    }

    logsArray.push(log);

    fs.writeFileSync(path, JSON.stringify(logsArray, null, 4), 'utf-8');
}


export async function downloadFile(url, path) {
  const writer = fs.createWriteStream(path);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log('Файл успешно загружен');
}


export async function downloadFromYoutube(url, sessionPath) {
  let optionss = {
    mode: 'text',
    pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
    pythonOptions: ['-u'], // get print results in real-time
    scriptPath: config.get("AUDIO_SEP_PATH"),
    args: [
      url,
      `${sessionPath}`,
    ]

  };
  try {
    const downloadFile = await PythonShell.run('dowload_from_youtube.py', optionss);
  } catch (err) {
    console.error(err);
  }

}

export async function separateAudio(sessionPath, filename = "audio.wav", model_name = "Kim_Vocal_2") {
  // Acquire semaphore before doing any work
  const [__,_,semaphorePower] = await readNumbersFromJson()
  semaphore_for_sep = new Semaphore(semaphorePower);
  await semaphore_for_sep.acquire();

  try {
    let optionss = {
      mode: 'text',
      pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: config.get("AUDIO_SEP_PATH"),
      args: [
        `${sessionPath}/${filename}`,
        `${sessionPath}`,
        model_name,
      ]
    };

    const messages = await PythonShell.run('script.py', optionss);

    let sessionVocalPath, sessonInstrumentalPath;

     

    if (model_name === "DeReverb") {
      sessonInstrumentalPath = await getInstrumentalFilePath(sessionPath, "DeReverb")
    } else {
      sessionVocalPath = await getVocalFilePath(sessionPath)
      sessonInstrumentalPath = await getInstrumentalFilePath(sessionPath)
    }

    console.log("1", sessionVocalPath, sessonInstrumentalPath, "3")

    if (model_name === "DeReverb") {
      await convertWavToMp3(sessonInstrumentalPath, `${sessionPath}/vocal_de_echo.mp3`);
    } else {
      await convertWavToMp3(sessionVocalPath, `${sessionPath}/vocal.mp3`);
      await convertWavToMp3(sessonInstrumentalPath, `${sessionPath}/instrumental.mp3`);
    }

    console.log("Файл успешно преобразован")
  } catch (err) {
    console.error(err);
  } finally {
    // Always release the semaphore
    semaphore_for_sep.release();
  }
}

export async function separateAudioVR(sessionPath, audio_path = "audio.wav", model_path = "URV_Models/hp_5_back.pth",outpath = "") {
  // Acquire semaphore before doing any work
  await semaphore_for_sep.acquire();

  try {
    let optionss = {
      mode: 'text',
      pythonPath: config.get("PYTHON_VENV_PATH"),
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: config.get("RVC_SCRIPT_PATH"),
      args: [
        '--model_path', model_path,
        '--audio_path', `${sessionPath}/${audio_path}`,
        '--save_path', `${sessionPath + outpath}`
      ]
    };

    const messages = await PythonShell.run('infer_uvr5.py', optionss);

    let sessionVocalPath;

    sessionVocalPath = await getVocalFilePath(sessionPath + outpath)

      await convertWavToMp3(sessionVocalPath, `${sessionPath}/vocal_de_back.mp3`);

    console.log("Файл успешно преобразован")
  } catch (err) {
    console.error(err);
  } finally {
    // Always release the semaphore
    semaphore_for_sep.release();
  }
}

// Создайте экземпляр семафора

export function updateNumbersInJson(transform, silero, separate) {
  const path = './config/power.json';
  const json = {
      "transform" : String(transform),
      "silero" : String(silero),
      "separate" : String(separate)
  };

  fs.writeFileSync(path, JSON.stringify(json), 'utf-8');
}


export async function createVoice(voice, text, id) {
  // Acquire semaphore before doing any work
  const [__,semaphorePower,_] = await readNumbersFromJson()
  semaphore_for_voice = new Semaphore(semaphorePower);
  await semaphore_for_voice.acquire();

  const readyText = processText(text)
  console.log(readyText)
  const data = {
    speaker: voice,
    text: readyText,
    session: id
  }

  console.log(data)
  try {
    const response = await axios.post('http://127.0.0.1:8010/tts/generate', data);
    return response;
  } catch (error) {
    console.error(error);
  } finally {
    // Always release the semaphore
    semaphore_for_voice.release();
  }
}

// const data = {
//   speaker: "xenia",
//   text: "Привет красавчик люблю тебя",
//   session: "string"
// };

