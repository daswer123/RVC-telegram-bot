import axios from 'axios';
import fs from "fs"
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

export async function generateSpeechYA(outputPath, filename, text, speaker, mood = "neutral") {
  const maxTextLength = 990;

  console.log(speaker,text)

  let sentences = text.match(/[^\.!\?]+[\.!\?]+|[^\.!\?]+$/g);
  console.log(sentences)

  let part = '';
  let partIndex = 0;

  for(let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    if ((part.length + sentence.length) <= maxTextLength) {
      part += sentence;
    } else {
      await generatePart(part, partIndex, speaker, mood,outputPath);
      part = sentence;
      partIndex += 1;
    }
  }

  if (part.length > 0) {
    await generatePart(part, partIndex, speaker, mood,outputPath);
  }

  const files = Array.from({length: partIndex + 1}, (v, i) => path.join(outputPath, `output${i + 1}.mp3`));

  if (files.length === 1) {
    fs.renameSync(files[0], path.join(outputPath, filename));
    console.log(`Renamed output1.mp3 to ${filename}`);
  } else {
    try {
      await mergeAudio(files, path.join(outputPath, filename));
      console.log(`Merged all parts into ${filename}`);

      for(let file of files) {
        fs.unlinkSync(file);
      }
      console.log('Deleted all individual parts');
    } catch (error) {
      console.error('Error merging audio files:', error);
    }
  }
}

async function generatePart(text, index, speaker, mood,outputPath) {
  const encodedText = encodeURIComponent(text);

  try {
    const response = await axios({
      method: 'get',
      url: `https://tts.voicetech.yandex.net/generate?key=d4f59475-9389-4622-a072-f1cbb0968bdf&text=${encodedText}&format=mp3&lang=ru-RU&emotion=${mood}&speaker=${speaker}&speed=1`,
      responseType: 'stream'
    });

    console.log(outputPath)

    const writer = fs.createWriteStream(path.join(outputPath, `output${index + 1}.mp3`));
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error generating part ${index + 1}:`, error);
  }
}

async function mergeAudio(files, output) {
  return new Promise((resolve, reject) => {
    let command = ffmpeg();

    // Добавить каждый файл в команду
    for (let file of files) {
      command = command.addInput(file);
    }

    command
      .on('end', resolve)
      .on('error', reject)
      .mergeToFile(output, './temp');
  });
}

// generateSpeech("Здесь ваш текст", "levian", "/the/path/where/you/want/to/store/files", "my_audio_file.mp3");