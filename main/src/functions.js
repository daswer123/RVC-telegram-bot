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
import { addLogToDatabase } from './server/db.js';
import { renameDemucsFiles } from './separate/botFunctios.js';


const { convert: convertNumberToWordsRu } = pkg;

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

export async function convertToOgg(inputPath) {
  const outputPath = path.format({
    dir: path.dirname(inputPath),
    name: path.basename(inputPath, path.extname(inputPath)),
    ext: '.ogg'
  });

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .format('ogg')
      .audioCodec('libopus')
      .on('end', () => {
        console.log('Conversion finished');
        resolve(outputPath);
      })
      .on('error', (error) => {
        console.error('Conversion failed: ' + error.message);
        reject(error);
      })
      .save(outputPath);
  });
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


export async function slowDownAudioYa(inputFile, speed) {
  // Создаем имя выходного файла с помощью path
  const directory = path.dirname(inputFile);
  const outputFile = path.join(directory, 'generated_voice_slowed.wav');

  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .audioFilters(`atempo=${speed}`)
      .output(outputFile)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}


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

export async function compressMp3Same(inputFile, quality = 2) {
  // Создаем временный файл для сжатия
  const outputFile = path.join(path.dirname(inputFile), `tmp_${path.basename(inputFile)}`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .output(outputFile)
      .audioCodec('libmp3lame')
      .audioQuality(quality)
      .outputOptions('-y')
      .on('end', async () => {
        console.log('Сжатие завершено');

        // Переименовываем временный файл в изначальный после сжатия
        try {
          await fspr.rename(outputFile, inputFile);
          resolve(inputFile);
        } catch (err) {
          console.error('Ошибка при переименовании файла:', err);
          reject(err);
        }
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

export const improveAudio = async (ctx, sessionPath, filename) => {
  let mp3Path = `${sessionPath}/${filename}`;

  let string;

  if (ctx.session.echoOn) {
    string = "--echo"
  }

  if (ctx.session.reverbOn) {
    string = "--reverb"
  }

  if (ctx.session.reverbOn && ctx.session.echoOn) {
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

  if (ctx.session.echoOn) {
    optionss.args.push('--echo-delay');
    optionss.args.push(ctx.session.echoDelay || 0.3);
    optionss.args.push('--echo-attenuation');
    optionss.args.push(ctx.session.echoPower || 0.1);
  }

  if (ctx.session.reverbOn) {
    optionss.args.push('--reverb-ratio');
    optionss.args.push(ctx.session.reverbPower || 0.0005);
  }

  const messages = await PythonShell.run('effects.py', optionss)
  return messages

}

export const improveAudiov2 = async (ctx, sessionPath, filename) => {
  try {
    let mp3Path = `${sessionPath}/${filename}`;

    let optionss = {
      mode: 'text',
      pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: config.get("AUDIO_SEP_PATH"),
      args: [
        '--input_file', mp3Path,
        '--output_file', `${sessionPath}/audio_out_improve.mp3`,
        '--compressorThreshold', ctx.session.compressorThreshold,
        '--compressorRatio', ctx.session.compressorRatio,
        '--highpassCutoff', ctx.session.highpassCutoff,
        '--lowpassCutoff', ctx.session.lowpassCutoff,
        '--noiseGateThreshold', ctx.session.noiseGateThreshold,
        '--chorusRate', ctx.session.chorusRate,
        '--chorusDepth', ctx.session.chorusDepth,
        '--reverbRoomSize', ctx.session.reverbRoomSize,
        '--reverbWetLevel', ctx.session.reverbWetLevel,
        '--delayTime', ctx.session.delayTime,
        '--delayMix', ctx.session.delayMix,
        '--pitchShift', ctx.session.pitchShift,
        '--chorusOn', String(ctx.session.chorusOn),
        '--reverbOn', String(ctx.session.reverbOn),
        '--delayOn', String(ctx.session.delayOn),
        '--pitchShiftOn', String(ctx.session.pitchShiftOn),
        '--noiseGateOn', String(ctx.session.noiseGateOn),
        '--highPassOn', String(false),
        '--lowPassOn', String(false),
        '--compressorOn', String(ctx.session.compressorOn),
        '--noiseGateOn', String(false)
      ]
    };

    const messages = await PythonShell.run('effectsv2.py', optionss)


    return messages
  } catch (err) {
    console.log(err)
  }
}

export const improveAudiov2Pre = async (ctx, sessionPath, filename) => {
  try {
    let mp3Path = `${sessionPath}/${filename}`;

    let optionss = {
      mode: 'text',
      pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: config.get("AUDIO_SEP_PATH"),
      args: [
        '--input_file', mp3Path,
        '--output_file', `${sessionPath}/audio_out_improve.mp3`,
        '--compressorThreshold', ctx.session.compressorThreshold,
        '--compressorRatio', ctx.session.compressorRatio,
        '--highpassCutoff', ctx.session.highpassCutoff,
        '--lowpassCutoff', ctx.session.lowpassCutoff,
        '--noiseGateThreshold', ctx.session.noiseGateThreshold,
        '--chorusRate', ctx.session.chorusRate,
        '--chorusDepth', ctx.session.chorusDepth,
        '--reverbRoomSize', ctx.session.reverbRoomSize,
        '--reverbWetLevel', ctx.session.reverbWetLevel,
        '--delayTime', ctx.session.delayTime,
        '--delayMix', ctx.session.delayMix,
        '--pitchShift', ctx.session.pitchShift,
        '--chorusOn', String(false),
        '--reverbOn', String(false),
        '--delayOn', String(false),
        '--pitchShiftOn', String(false),
        '--noiseGateOn', String(ctx.session.noiseGateOn),
        '--highPassOn', String(ctx.session.highPassOn),
        '--lowPassOn', String(ctx.session.lowPassOn),
        '--compressorOn', String(ctx.session.compressorOn),
        '--noiseGateOn', String(false)
      ]
    };

    const messages = await PythonShell.run('effectsv2.py', optionss)


    return messages
  } catch (err) {
    console.log(err)
  }
}

export const phoneCallEffects = async (ctx, sessionPath, filename) => {
  let mp3Path = `${sessionPath}/${filename}`;

  let optionss = {
    mode: 'text',
    pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
    pythonOptions: ['-u'], // get print results in real-time
    scriptPath: config.get("AUDIO_SEP_PATH"),
    args: [
      mp3Path,
      `${sessionPath}/audio_out_improve.mp3`,
      // 500,
      // 1000
    ]
  };

  const messages = await PythonShell.run('phonecall.py', optionss)
  return messages

}

export const addReverbEffect = async (ctx, sessionPath, filename) => {
  let mp3Path = `${sessionPath}/${filename}`;

  let optionss = {
    mode: 'text',
    pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
    pythonOptions: ['-u'], // get print results in real-time
    scriptPath: config.get("AUDIO_SEP_PATH"),
    args: [
      mp3Path,
      `${sessionPath}/audio_out_improve.mp3`,
      // 500,
      // 1000
    ]
  };

  const messages = await PythonShell.run('phonecall.py', optionss)
  return messages

}

export const addEchoEffect = async (ctx, sessionPath, filename) => {
  let mp3Path = `${sessionPath}/${filename}`;

  let optionss = {
    mode: 'text',
    pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
    pythonOptions: ['-u'], // get print results in real-time
    scriptPath: config.get("AUDIO_SEP_PATH"),
    args: [
      mp3Path,
      `${sessionPath}/audio_out_improve.mp3`,
      // 500,
      // 1000
    ]
  };

  const messages = await PythonShell.run('phonecall.py', optionss)
  return messages

}

export const autotuneAudio = async (ctx, sessionPath, filename) => {
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


export const transformAudio = async (ctx, sessionPath, audioPath = "", setMp3 = false, ctxx = "") => {
  // Ensure semaphore is released, even if there is an error
  try {
    console.log(ctx.session)
    const tg_options = ctx.session
    const method = tg_options.method;
    const index_ratio = tg_options.feature_ratio;
    const protect_voice = tg_options.protect_voiceless;
    const pith = tg_options.pith;
    const mangio_crepe_hop = tg_options.mangio_crepe_hop;

    let minPich = Number(tg_options.minPich);
    let maxPich = Number(tg_options.maxPich);

    if (isNaN(minPich)) minPich = 50
    if (isNaN(maxPich)) maxPich = 1100

    let neuroAutoTune = tg_options.neuroAutoTune

    if (neuroAutoTune === undefined) {
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

    console.log(options.args, sessionPath)

    const messages = await PythonShell.run('test-infer.py', options);
    console.log("Файл успешно преобразован");

    // logUserSession(ctx, "transform", ctx.session.name)

    if (setMp3) {
      await compressMp3(mp3Path);
      console.log("Файл успешно cжат");
    }
  } catch (err) {
    console.error(err);
  }
};
export async function handleSeparateAudio(ctx, sessionPath, isAudio = false) {
  try {
    const fullSessionPath = path.join(config.get("MAIN_PATH"), sessionPath);
    const vocalPath = path.join(fullSessionPath, "vocal.mp3");
    const instrumentalPath = path.join(fullSessionPath, "instrumental.mp3");

    let vocalPathDeEcho, vocalString, backVocal;

    vocalString = "Вокал"

    const prevState = ctx.session.audioProcessPower
    ctx.session.audioProcessPower = "both"

    await separateAudio(sessionPath, "audio.wav");

    if (ctx.session.audioProcessPower === "echo" || ctx.session.audioProcessPower === "both") {
      await separateAudio(sessionPath, "vocal.mp3", "DeReverb");
      vocalString += " ,без эха"
    }

    if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both") {
      if (ctx.session.audioProcessPower === "backvocal") {
        await separateAudioVR(sessionPath, "vocal.mp3", "URV_Models/hp_5_back.pth", "/out_back",)
      } else {
        await separateAudioVR(sessionPath, "vocal_de_echo.mp3", "URV_Models/hp_5_back.pth", "/out_back")
      }
      vocalString += " ,без бек вокала"
    }

    if (ctx.session.audioProcessPower === "echo") {
      vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_echo.mp3");
    }

    if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both") {
      vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_back.mp3");
    }

    return { vocalPath, instrumentalPath, vocalPathDeEcho, vocalString }


  } catch (err) {
    console.log(err);
  }
}

export async function handleSeparateAudiov2(sessionPath, filename = "audio.wav", isAudio = false) {
  try {
    const fullSessionPath = path.join(config.get("MAIN_PATH"), sessionPath);
    const vocalPathh = path.join(fullSessionPath, "vocals.mp3");
    const instrumentalPathh = path.join(fullSessionPath, "no_vocals.mp3");

    await separateAudiov2(sessionPath, filename, "htdemucs");

    return { vocalPathh, instrumentalPathh }
  } catch (err) {
    console.log(err)
  }

}

export async function handleSeparateAudiov3(sessionPath, filename = "audio.wav", isAudio = false) {
  try {
    const fullSessionPath = path.join(config.get("MAIN_PATH"), sessionPath);
    const vocalPathh = path.join(fullSessionPath, "vocals.mp3");
    const instrumentalPathh = path.join(fullSessionPath, "no_vocals.mp3");

    await separateAudiov3(sessionPath, filename, "htdemucs_ft");

    return { vocalPathh, instrumentalPathh }
  } catch (err) {
    console.log(err)
  }

}

export async function handleSeparateAudio6Items(sessionPath, filename = "audio.wav", isAudio = false) {
  try {
    const fullSessionPath = path.join(config.get("MAIN_PATH"), sessionPath);
    // const vocalPathh = path.join(fullSessionPath, "vocals.mp3");
    // const instrumentalPathh = path.join(fullSessionPath, "no_vocals.mp3");

    await separateAudio6Items(sessionPath, filename, "htdemucs_6s");

    const newPath = path.join(sessionPath, "6s")
    const files = await fspr.readdir(newPath);

    console.log("Сжимаем файлы")
    for (let file of files) {
      if (path.extname(file) === '.mp3') { // Сжимаем и отправляем только mp3 файлы
        const filePath = path.join(newPath, file);
        await compressMp3Same(filePath, 2)
      }
    }


    return
  } catch (err) {
    console.log(err)
  }

}

export async function handleSeparateAudio4Items(sessionPath, filename = "audio.wav", isAudio = false) {
  try {
    const fullSessionPath = path.join(config.get("MAIN_PATH"), sessionPath);
    // const vocalPathh = path.join(fullSessionPath, "vocals.mp3");
    // const instrumentalPathh = path.join(fullSessionPath, "no_vocals.mp3");

    await separateAudio4Items(sessionPath, filename, "htdemucs_ft");

    const newPath = path.join(sessionPath, "ft")
    const files = await fspr.readdir(newPath);

    console.log("Сжимаем файлы")
    for (let file of files) {
      if (path.extname(file) === '.mp3') { // Сжимаем и отправляем только mp3 файлы
        const filePath = path.join(newPath, file);
        await compressMp3Same(filePath, 2)
      }
    }


    return
  } catch (err) {
    console.log(err)
  }

}



export async function handleDenoiseAudio(sessionPath, filename = "audio.wav", isAudio = false) {
  try {
    const fullSessionPath = path.join(config.get("MAIN_PATH"), sessionPath);
    // const vocalPathh = path.join(fullSessionPath, "vocals.mp3");
    // const instrumentalPathh = path.join(fullSessionPath, "no_vocals.mp3");

    await denoiseAudioFunc(sessionPath, filename);


    return
  } catch (err) {
    console.log(err)
  }

}



export async function handleAICover(ctx, sessionPath, filename = "audio.wav") {
  // Создаем папку сессии, если она еще не существует
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const fullSessionPath = path.join(config.get("MAIN_PATH"), sessionPath);
  const vocalPath = path.join(fullSessionPath, "vocal.mp3");
  const instrumentalPath = path.join(fullSessionPath, "instrumental.mp3");
  let sessionOutputPath = path.join(fullSessionPath, "audio_out_cut.mp3");
  const resultPath = path.join(fullSessionPath, "result.mp3");

  let vocalPathDeEcho, vocalString;

  vocalString = "Вокал"

  let vocalFileName = "vocal.mp3"

  await separateAudiov2(sessionPath, "audio.wav");

  await compressMp3Same(instrumentalPath, 2)

  if (ctx.session.audioProcessPower === "echo" || ctx.session.audioProcessPower === "both") {
    await separateAudio(sessionPath, "vocal.mp3", "DeReverb");
    vocalString += " ,без эха"
  }

  if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both") {
    if (ctx.session.audioProcessPower === "backvocal") {
      await separateAudioVR(sessionPath, "vocal.mp3", "URV_Models/hp_5_back.pth", "/out_back",)
    } else {
      await separateAudioVR(sessionPath, "vocal_de_echo.mp3", "URV_Models/hp_5_back.pth", "/out_back")
    }
    vocalString += " ,без бек вокала"
  }

  if (ctx.session.audioProcessPower === "echo") {
    vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_echo.mp3");
    vocalFileName = "vocal_de_echo.mp3"
  }

  if (ctx.session.audioProcessPower === "backvocal" || ctx.session.audioProcessPower === "both") {
    vocalPathDeEcho = path.join(fullSessionPath, "vocal_de_back.mp3");
    vocalFileName = "vocal_de_back.mp3"
  }

  if (!vocalPathDeEcho) vocalPathDeEcho = vocalPath

  if (ctx.session.lowPassOn || ctx.session.highPassOn || ctx.session.compressorOn || ctx.session.noiseGateOn) {
    await improveAudiov2Pre(ctx, sessionPath, vocalFileName)
    vocalPathDeEcho = `${sessionPath}/audio_out_improve.mp3`
  }

  await transformAudio(ctx, sessionPath, vocalPathDeEcho, true);

  if (ctx.session.autoTune) {
    await autotuneAudio(ctx, sessionPath, vocalFileName)
    sessionOutputPath = path.join(fullSessionPath, "autotune_vocal.mp3");
  }

  if (ctx.session.chorusOn || ctx.session.reverbOn || ctx.session.delayOn || ctx.session.pitchShiftOn || ctx.session.compressorOn) {
    sessionOutputPath = path.join(fullSessionPath, "autotune_vocal.mp3");
    ctx.session.voice_volume += 0.5

    // Проверьте, существует ли файл
    if (!fs.existsSync(sessionOutputPath)) {
      // Если файла не существует, то примените audio_out.mp3
      await improveAudiov2(ctx, sessionPath, "audio_out_cut.mp3");
      sessionOutputPath = path.join(sessionPath, "audio_out_improve.mp3");
    } else {
      await improveAudiov2(ctx, sessionPath, "autotune_vocal.mp3");
      sessionOutputPath = path.join(sessionPath, "audio_out_improve.mp3");
    }
  }

  await mergeAudioFilesToMp3(sessionOutputPath, instrumentalPath, resultPath, ctx);
  return { vocalPathDeEcho, sessionOutputPath, instrumentalPath, resultPath };
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



export function logUserSession(ctx, type, extra = "") {
  const uniqueId = ctx.from && ctx.from.id;
  const username = ctx.from && ctx.from.username;
  console.log(`uniqueId: ${uniqueId}, username: ${username}, session: ${ctx.session}`); // Добавлено для отладки
  if (uniqueId && username && ctx.session) {
    // Если ctx.session - объект, выберите нужное значение
    const session = JSON.stringify(ctx.session); // Например, если ctx.session = {id: 1}
    addLogToDatabase(uniqueId, username, session, type, extra);
  } else {
    console.error('One or more parameters are undefined.');
  }
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
  }
}

export async function separateAudiov2(sessionPath, filename = "audio.wav", model_name = "htdemucs") {
  // Acquire semaphore before doing any work
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
        2,
        true
      ]
    };

    const messages = await PythonShell.run('separatev2.py', optionss);

    let sessionVocalPath, sessonInstrumentalPath;

    sessionVocalPath = path.join(sessionPath, "vocal.mp3")
    sessonInstrumentalPath = path.join(sessionPath, "instrumental.mp3")

    console.log("1", sessionVocalPath, sessonInstrumentalPath, "3")
    await renameDemucsFiles(sessionPath)

    console.log("Файл успешно преобразован")
    return { sessionVocalPath, sessonInstrumentalPath }
  } catch (err) {
    console.error(err);
  }
}

export async function separateAudiov3(sessionPath, filename = "audio.wav", model_name = "htdemucs_ft") {
  // Acquire semaphore before doing any work
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
        2,
        true
      ]
    };

    const messages = await PythonShell.run('separatev2.py', optionss);

    let sessionVocalPath, sessonInstrumentalPath;

    sessionVocalPath = path.join(sessionPath, "vocal.mp3")
    sessonInstrumentalPath = path.join(sessionPath, "instrumental.mp3")

    console.log("1", sessionVocalPath, sessonInstrumentalPath, "3")
    await renameDemucsFiles(sessionPath)

    console.log("Файл успешно преобразован")
    return { sessionVocalPath, sessonInstrumentalPath }
  } catch (err) {
    console.error(err);
  }
}

export async function separateAudio6Items(sessionPath, filename = "audio.wav", model_name = "htdemucs") {
  // Acquire semaphore before doing any work
  try {
    let optionss = {
      mode: 'text',
      pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: config.get("AUDIO_SEP_PATH"),
      args: [
        `${sessionPath}/${filename}`,
        `${sessionPath}/6s`,
        model_name,
        2,
        false
      ]
    };

    const messages = await PythonShell.run('separatev2.py', optionss);

    console.log("Файл успешно преобразован")
    return sessionPath
  } catch (err) {
    console.error(err);
  }
}

export async function separateAudio4Items(sessionPath, filename = "audio.wav", model_name = "htdemucs_ft") {
  // Acquire semaphore before doing any work
  try {
    let optionss = {
      mode: 'text',
      pythonPath: config.get("PYTHON_VENV_SEP_PATH"),
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: config.get("AUDIO_SEP_PATH"),
      args: [
        `${sessionPath}/${filename}`,
        `${sessionPath}/6s`,
        model_name,
        2,
        false
      ]
    };

    const messages = await PythonShell.run('separatev2.py', optionss);

    console.log("Файл успешно преобразован")
    return sessionPath
  } catch (err) {
    console.error(err);
  }
}

export async function denoiseAudioFunc(sessionPath, audio_path = "audio.wav", model_path = "URV_Models/denoise.pth", outpath = "") {
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
  }
}



export async function separateAudioVR(sessionPath, audio_path = "audio.wav", model_path = "URV_Models/hp_5_back.pth", outpath = "") {
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
  }
}


// Создайте экземпляр семафора

export function updateNumbersInJson(transform, silero, separate) {
  const path = './config/power.json';
  const json = {
    "transform": String(transform),
    "silero": String(silero),
    "separate": String(separate)
  };

  fs.writeFileSync(path, JSON.stringify(json), 'utf-8');
}


export async function createVoice(voice, text, id) {
  const readyText = await processText(text)
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
  }
}

// const data = {
//   speaker: "xenia",
//   text: "Привет",
//   session: "string"
// };

