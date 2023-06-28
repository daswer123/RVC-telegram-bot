import axios from 'axios';
import fs from 'fs';
import { PythonShell } from 'python-shell';
import config from "config";


let options = {
    mode: 'text',
    pythonPath: config.get("PYTHON_VENV_PATH"),
    pythonOptions: ['-u'], // get print results in real-time
    scriptPath: config.get("RVC_SCRIPT_PATH"),
    args: [
        "0",
        "E:\\AI\\Audio\\AI\\Mango-RVC\\OUTPUTS\\test.wav",
        "E:\\AI\\Audio\\AI\\Mango-RVC\\OUTPUTS\\alica\\alica_index.index",
        "harvest",
        "test_v2.wav",
        "E:\\AI\\Audio\\AI\\Mango-RVC\\OUTPUTS\\alica\\alica_zayac.pth",
        "0.66",
        "cuda:0",
        "True",
        "3",
        "0",
        "1",
        "0.33",
        "128"
      ]
};


export const transformAudio = async (tg_options,sessionPath) => {

    const method = tg_options.method;
    const index_ratio = tg_options.featureRatio;
    const protect_voice = tg_options.protectVoiceless;
    const pith = tg_options.pith;
    const mangio_crepe_hop = tg_options.mangioCrepeHop;

    const model_path = tg_options.model_path;
    const model_index = tg_options.model_index;

    console.log(tg_options,sessionPath);

    options = {
        mode: 'text',
        pythonPath: config.get("PYTHON_VENV_PATH"),
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: config.get("RVC_SCRIPT_PATH"),
        args: [
            pith,
            `${sessionPath}/audio.ogg`,
            model_index,
            method,
            `${sessionPath}/audio_out.ogg`,
            model_path,
            index_ratio,
            "cuda:0",
            "True",
            "3",
            "0",
            "1",
            protect_voice,
            mangio_crepe_hop
          ]
    };




    try {
        const messages = await PythonShell.run('test-infer.py', options);
        console.log("Файл успешно преобразован")
    } catch (err) {
        console.error(err);
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

