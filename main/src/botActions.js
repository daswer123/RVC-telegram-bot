import { showMenu, showSettings, showCurrentSettings, loadSettings, showAICoverSettings, showCreateMenu, showEffectsSettings } from "./botFunction.js";
import { INITIAL_SESSION, characters } from "./variables.js";
import { Markup } from "telegraf";
import path from "path";
import fs from 'fs'
import { deleteFolderContents, getRandomFileContent } from "./functions.js";

const MALE_VOICES = [
  { name: "Aidar", id: "aidar" },
  { name: "Eugene", id: "eugene" },
];

const FEMALE_VOICES = [
  { name: "Baya", id: "baya" },
  { name: "Kseniya", id: "kseniya" },
  { name: "Xenia", id: "xenia" },
];

function getRandomMaleVoice() {
  const index = Math.floor(Math.random() * MALE_VOICES.length);
  return MALE_VOICES[index].id;
}

function getRandomFemaleVoice() {
  const index = Math.floor(Math.random() * FEMALE_VOICES.length);
  return FEMALE_VOICES[index].id;
}

export function groupCharactersByCategory(characters) {
  const categories = {};
  characters.forEach((character) => {
    const category = character.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(character);
  });
  return categories;
}

const groupedCharacters = groupCharactersByCategory(characters);

export function registerBotActions(bot) {

  bot.action("set_minPich",async (ctx) => {
      ctx.reply("Введите, либо значение в Гц или формат [Нота][Октава]\nНапример: C0, C#0\nМожно ввести так: 50\nМинимальное значение 1Гц или С0 или E10")

      ctx.session.waitForMinPich = true
  })

  bot.action("set_maxPich",async (ctx) => {
    ctx.reply("Введите, либо значение в Гц или формат [Нота][Октава]\nНапример: E10, C#0\nnМожно ввести так: 1100\nМаксимальное значение 16000Гц или С0 или E10")

    ctx.session.waitForMaxPich = true
    
  })

    bot.action("effects_settings", async(ctx) =>{

      showEffectsSettings(ctx)

      ctx.session.waitingForCover = false;
    ctx.session.mergeAudio = false;
    })

  bot.action("effect_echo_delay", async(ctx) =>{
    ctx.reply("Введите значение для задержи эха\nЗначение по умолчанию: 0.3")

    ctx.session.waitForEchoDelay = true
  })

  bot.action("effect_echo_power", async(ctx) =>{
    ctx.reply("Введите значение для громкости эха\nЗначение по умолчанию: 0.1")

    ctx.session.waitForEchoPower = true
  })

  bot.action("effect_reverb", async(ctx) =>{
    ctx.reply("Введи силу эффекта реверберации\nЗначение по умолчанию: 0.0005")

    ctx.session.waitForReverb = true
  })

  bot.action("effect_autotune_attack", async(ctx) =>{
    ctx.reply("Введите значение для силы воздействия автотюна\nЗначение по умолчанию: 0.1")

    ctx.session.waitForAutotuneAttack = true
  })

  bot.action("effect_autotune_str", async(ctx) =>{
    ctx.reply("Введите значение для силы применения автотюна\nЗначение по умолчанию: 0.9")

    ctx.session.waitForAutotuneStr = true
  })

  bot.action("toggle_autotune",async(ctx) =>{
    ctx.session.neuroAutoTune = ctx.session.neuroAutoTune ? false : true 
    ctx.session.autoTune = false

    ctx.reply(`Автотюн от нейросети успешно ${ctx.session.neuroAutoTune === true ? "Включенн" : "Выключенн"}`, Markup.inlineKeyboard([
      Markup.button.callback('Назад', 'menu'),
    ]))
  })

  
  bot.action("toggle_audio_reverb", async (ctx) => {
    ctx.reply("Реверберация успешно включенна")
    ctx.session.reverbOn = ctx.session.reverbOn === true ? false : true
    ctx.reply(`Реверберация успешно ${ctx.session.reverbOn === true ? "Включенна" : "Выключенна"}`, Markup.inlineKeyboard([
      Markup.button.callback('Назад', 'aisettings'),
    ]))
  })

  bot.action("toggle_audio_echo", async (ctx) => {
    ctx.session.echoOn = ctx.session.echoOn === true ? false : true
    ctx.reply(`Эхо успешно ${ctx.session.echoOn === true ? "Включенно" : "Выключенно"}`, Markup.inlineKeyboard([
      Markup.button.callback('Назад', 'aisettings'),
    ]))
  })

  bot.action("toggle_audio_autotune", async (ctx) => {
    ctx.session.autoTune = ctx.session.autoTune === true ? false : true

    ctx.session.neuroAutoTune = false
    ctx.reply(`Автотюн успешно ${ctx.session.autoTune === true ? "Включенн" : "Выключенн"}`, Markup.inlineKeyboard([
      Markup.button.callback('Назад', 'aisettings'),
    ]))
  })

  bot.action("admin_ban_user", async(ctx) => {
    ctx.reply("Введите ID пользователя которого нужно забанить")
    ctx.session.waitForBan = true
  })
  bot.action("admin_unban_user", async(ctx) => {
    ctx.reply("Введите ID пользователя которого нужно разбанить")
    ctx.session.waitForUnBan = true
  })

  bot.action("admin_show_stats", async(ctx) => {
    // const fs = require('fs');
    const path = './config/logs.json';
  
    // Читаем файл
    const data = fs.readFileSync(path, 'utf-8');
    const logs = JSON.parse(data);
  
    // Получаем текущую дату и время
    const now = new Date();
  
    // Фильтруем массив, чтобы оставить только записи за последние 24 часа
    const recentLogs = logs.filter(log => {
      if(!log.date) return false;
      const logDate = new Date(log.date);
      // Время в миллисекундах между logDate и now
      const diff = now - logDate;
      // Преобразуем разницу в часы
      const diffInHours = diff / 1000 / 60 / 60;
      // Возвращаем true, если diffInHours меньше или равно 24
      return diffInHours <= 24;
    });
  
    // Создаем Map для подсчета каждого уникального пользователя и каждого уникального элемента в поле extra
    const userCounts = new Map();
    const modelCounts = new Map();
  
    // Проходим по каждому log
    recentLogs.forEach(log => {
      // Подсчитываем пользователя
      if (userCounts.has(log.uniqueId)) {
        userCounts.set(log.uniqueId, userCounts.get(log.uniqueId) + 1);
      } else {
        userCounts.set(log.uniqueId, 1);
      }
  
      // Подсчитываем модель
      if (log.type === 'transform') {
        if (modelCounts.has(log.extra)) {
          modelCounts.set(log.extra, modelCounts.get(log.extra) + 1);
        } else {
          modelCounts.set(log.extra, 1);
        }
      }
    });
  
    // Преобразуем Map в массив массивов, сортируем его и преобразуем обратно в Map
    const sortedUserCounts = new Map([...userCounts.entries()].sort((a, b) => b[1] - a[1]));
    const sortedModelCounts = new Map([...modelCounts.entries()].sort((a, b) => b[1] - a[1]));

    let userCountsMessage = '*Статистика по использованию, среди пользователей за последние 24 часа:*\n\n';
    sortedUserCounts.forEach((count, userId) => {
      userCountsMessage += `*${userId}* - ${count} преобразований\n`;
    });
    ctx.replyWithMarkdown(userCountsMessage);

    let modelCountsMessage = '*Статистика по использованию моделей в общем за последние 24 часа:*\n\n';
    sortedModelCounts.forEach((count, modelName) => {
      modelCountsMessage += `*${modelName.slice(0, -2)}* - ${count} раз\n`;
    });
    ctx.replyWithMarkdown(modelCountsMessage);
  });

  bot.action("admin_clear_folder", async(ctx) => {
    const sessionsDir = './sessions/';
    const userIds = fs.readdirSync(sessionsDir).map(Number);

    for (const userId of userIds) {
        try {
          deleteFolderContents(sessionsDir+userId);
        } catch (error) {
            console.error(`Не удалось получить информацию о пользователе ${userId}:`, error);
        }
    }

});



bot.action("toggle_audio_effects", async(ctx) => {
  ctx.session.improveAudio = ctx.session.improveAudio === true ? false : true
  ctx.reply("Вы переключили эффекты на голос ( эхо, реверб, нормализация ) на " + ctx.session.improveAudio )
})


  bot.action("admin_control_power", async(ctx) => {
    ctx.session.waitForControlPower = true
    ctx.reply("Введите 3 числа через запятую, эти числа значат нагрузку на:\n1)Преобразование\n2)TTS\n3)Разделение аудио\nПример: 1,1,1")
  })

  bot.action("admin_send_msg_all", async(ctx) => {
    ctx.session.waitForAnonceAll = true
    ctx.reply("Введите сообщение которое получат все пользователи")
  })

  bot.action("admin_send_msg_сurrent", async(ctx) => {
    ctx.session.waitForAnonceCurrent = true
    ctx.reply("Введите сообщение которое получат все пользователи\nВведите в формате 'id,message' ")
  })

  bot.action("get_all_user_id", async(ctx) => {
    const sessionsDir = './sessions';
    const userIds = fs.readdirSync(sessionsDir).map(Number);

    let message = '';
    for (const userId of userIds) {
        try {
            const chat = await ctx.telegram.getChat(userId);
            const username = chat.username || 'Нет ника';
            message += "`" + userId + "`"  + ` - ${username}\n`;
        } catch (error) {
            console.error(`Не удалось получить информацию о пользователе ${userId}:`, error);
        }
    }

    try {
      await ctx.replyWithMarkdown(message);
    } catch (error) {
        console.error('Не удалось отправить сообщение:', error);
    }
});


  bot.action("menu", async (ctx) => {
    ctx.session.waitingForCover = false;
    ctx.session.mergeAudio = false;

    showMenu(ctx)
  })
  bot.action("current_settings", async (ctx) => {
    
    await showCurrentSettings(ctx);
  });

  // Обработчик для кнопки "save_preset"
  bot.action('save_preset', (ctx) => {
    
    // Перед сохранением пресета, спросим у пользователя имя для пресета
    ctx.reply('Пожалуйста, введите имя для вашего пресета:');
    ctx.session.waitForPresetSave = true
    // Следующее сообщение пользователя будет обработано как имя пресета
    // bot.on('message', handlePresetName);
  });

  // Обработчик для кнопки "load_preset"
  bot.action('load_preset', (ctx) => {
    
    loadSettings(ctx)
  });

  // Обработчик для кнопки "load_preset"
  bot.action('make_predlog', (ctx) => {
    
    ctx.reply("Напишите какой функционал вы бы хотели видеть в боте, какую голосовую модель стоит добавить.")
    ctx.session.waitForPredlog = true;
  });
  

  // Обработчик для кнопок пресетов
  bot.action(/select_preset:(.+)/, (ctx) => {
    const presetName = ctx.match[1];
    // Ответ пользователю
    ctx.reply(`Пресет "${presetName}" выбран. Хотите загрузить его сейчас?`, Markup.inlineKeyboard([
      [Markup.button.callback('Загрузить пресет', `load_preset:${presetName}`), Markup.button.callback('Удалить пресет', `delete_preset:${presetName}`)],
      [Markup.button.callback('Перезаписать пресет', `overwrite_preset:${presetName}`), Markup.button.callback('Меню', 'menu')],
    ]));
  });

  // Обработчик для кнопки "load_preset"
  bot.action(/load_preset:(.+)/, (ctx) => {
    
    const presetName = ctx.match[1];

    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
    const sessionPath = path.join('sessions', String(uniqueId));
    const presetsFilePath = path.join(sessionPath, 'presets.json');

    if (fs.existsSync(presetsFilePath)) {
      const presetsFileContent = fs.readFileSync(presetsFilePath);
      const presets = JSON.parse(presetsFileContent);

      if (presets[presetName]) {
        // Загружаем пресет в текущую сессию
        // ctx.session = presets[presetName];
        ctx.session.loadConfig = {...presets[presetName]}

        // Ответ пользователю
        ctx.reply(`Пресет "${presetName}" успешно загружен.`, Markup.inlineKeyboard([
          Markup.button.callback('Меню', 'menu'),
        ]));
      } else {
        ctx.reply('Выбранный пресет не найден.', Markup.inlineKeyboard([
          Markup.button.callback('Меню', 'menu')
        ]));
      }
    } else {
      ctx.reply('У вас нет сохраненных пресетов.', Markup.inlineKeyboard([
        Markup.button.callback('Меню', 'menu')
      ]));
    }
  });

  bot.action("create_voice_info",async (ctx) => {
    await ctx.reply(`Итак перед тем как дать инструкцию о том что нужно сделать что бы получить свою языковую модель, хочу уточнить пару деталей \nАвтоматического создания модели нет и все образцы которые вы запишете через эти кнопки, я смогу обучить через какое-то время, я сделаю оповещение когда модель будет готова.`)
    await ctx.reply("\nПеред тем как кидать голосовое сообщение убедитесь что вы находитесь в тихом помещение, нет посторонних шумов, качество модели напрямую зависит от качества записанного голосового")
    await ctx.reply("\nВы можете выбрать получить текст и перед вами появится 1 из 10 подготовленных текстов, не обязательно зачитывать именно его, вы можете сами зачитать или напеть что угодно, общая продолжительность должна быть более 90 секунд, иначе не ручаюсь за похожесть, чем больше тем лучше, но не более 5 минут.", Markup.inlineKeyboard([
      Markup.button.callback('Меню', 'show_create_voice_menu')
    ]))
  })

  bot.action("create_voice_name",(ctx) =>{
    ctx.reply("Введите название для вашей голосовой модели")
    ctx.session.waitForModelName = true
  })

  bot.action("create_voice_random_text",async (ctx) =>{
    const text = await getRandomFileContent();

    await ctx.reply(text, Markup.inlineKeyboard([
      [Markup.button.callback('Записать голосовое', 'create_voice_add_sample'),Markup.button.callback('Назад', 'show_create_voice_menu')]
    ]))
  })

  bot.action("create_voice_add_sample",async(ctx) => {
    if(!ctx.session.voiceModelName) {
      ctx.reply("Перед тем как скидывать, инициализируйте модель", Markup.inlineKeyboard([
        Markup.button.callback('Инициализировать модель', 'create_voice_name')
      ]))
      return
    }
    ctx.reply("Вы можете переслать любое голосовое сообщение от кого-либо боту\nСкиньте аудиофайл ( до 20 мб ) или запишите голосовое")
    ctx.session.waitForVoice = true
  })

  bot.action("create_voice_end",async(ctx) => {
    if(!ctx.session.voiceModelName) {
      ctx.reply("Перед заканчивать создание, вы должны инициализировать модель", Markup.inlineKeyboard([
        Markup.button.callback('Инициализировать модель', 'create_voice_name')
      ]))
      return
    }
    await ctx.reply("Все ваши данные были записанны, ждите когда у админа появится время и он сможет обработать и создать вашу голосовую модель", Markup.inlineKeyboard([
      Markup.button.callback('Меню', 'menu')
    ]))

    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
    const folderName = ctx.session.voiceModelName
    let voicePath = `train_voice/${uniqueId}/${folderName}`;

    // создаем папку сессии, если она еще не существует
    if (!fs.existsSync(voicePath)) {
      fs.mkdirSync(voicePath, { recursive: true });
    }

    // создаем и записываем файл
    const filePath = path.join(voicePath, 'desc.txt');
    const fileContent = `${ctx.session.voiceModelName}\n${ctx.session.voiceModelDesc}\n${ctx.session.voiceModelGender}`;
    fs.writeFileSync(filePath, fileContent);

    console.log("Пользователь завершил сбор датасета и ждет когда его модель будет готова")
    
    // создаем объект для JSON файла
    const jsonContent = {
      username: ctx.from.username,
      id: ctx.from.id,
      modelName: ctx.session.voiceModelName,
      date: new Date().toISOString()
    };

    // создаем и записываем JSON файл
    const jsonFilePath = path.join('waitForModel.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonContent, null, 2));

    ctx.session.voiceModelName = ""
    ctx.session.voiceModelDesc = ""
    ctx.session.voiceModelGender = ""
  })

  


  bot.action("show_create_voice_menu",(ctx) =>{
    ctx.session.waitingForCover = false;
    ctx.session.mergeAudio = false;

    showCreateMenu(ctx)
    return
  })

  // Обработчик для кнопки "delete_preset"
  bot.action(/delete_preset:(.+)/, (ctx) => {
    
    const presetName = ctx.match[1];

    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
    const sessionPath = path.join('sessions', String(uniqueId));
    const presetsFilePath = path.join(sessionPath, 'presets.json');

    if (fs.existsSync(presetsFilePath)) {
      const presetsFileContent = fs.readFileSync(presetsFilePath);
      const presets = JSON.parse(presetsFileContent);

      if (presets[presetName]) {
        // Удаляем пресет
        delete presets[presetName];

        // Сохраняем обновленные пресеты обратно в файл
        fs.writeFileSync(presetsFilePath, JSON.stringify(presets));

        // Ответ пользователю
        ctx.reply(`Пресет "${presetName}" успешно удален.`, Markup.inlineKeyboard([
          Markup.button.callback('Меню', 'menu')
        ]));
      } else {
        ctx.reply('Выбранный пресет не найден.', Markup.inlineKeyboard([
          Markup.button.callback('Меню', 'menu')
        ]));
      }
    } else {
      ctx.reply('У вас нет сохраненных пресетов.', Markup.inlineKeyboard([
        Markup.button.callback('Меню', 'menu')
      ]));
    }
  });

  // Обработчик для кнопки "overwrite_preset"
  bot.action(/overwrite_preset:(.+)/, (ctx) => {
    // 
    const presetName = ctx.match[1];

    const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
    const sessionPath = path.join('sessions', String(uniqueId));
    const presetsFilePath = path.join(sessionPath, 'presets.json');

    if (fs.existsSync(presetsFilePath)) {
      const presetsFileContent = fs.readFileSync(presetsFilePath);
      const presets = JSON.parse(presetsFileContent);

      if (presets[presetName]) {
        // Перезаписываем пресет текущими настройками пользователя
        presets[presetName] = ctx.session;

        // Сохраняем обновленные пресеты обратно в файл
        fs.writeFileSync(presetsFilePath, JSON.stringify(presets));

        // Ответ пользователю
        ctx.reply(`Пресет "${presetName}" успешно перезаписан.`, Markup.inlineKeyboard([
          Markup.button.callback('Меню', 'menu')
        ]));
      } else {
        ctx.reply('Выбранный пресет не найден.', Markup.inlineKeyboard([
          Markup.button.callback('Меню', 'menu')
        ]));
      }
    } else {
      ctx.reply('У вас нет сохраненных пресетов.', Markup.inlineKeyboard([
        Markup.button.callback('Меню', 'menu')
      ]));
    }
  });

  bot.action("cover", async (ctx) => {
    
    ctx.session.waitingForCover = true;
    await ctx.reply(
      "Вы можете создать ИИ кавер с голосом вашего персонажа\n\nПеред тем как начать настройте высоту тона персонажа в настройках, что бы он соответсвовал голосу певца\nОбычно если у вас Муж. голос и песня с муж. Голосом то ставьте Pith 0\nЕсли у вас муж. голос, а поёт девушка то ставьте Pitch 12\nИ все тоже самое для женского голоса только наоборот\n\nИмейте ввиду что под разные песни нужно корректировать Pitch\n\nЧто бы отменить текущий режим введите любые буквы\n\nОтправьте ссылку на ютуб или загрузите боту напрямую аудиофайл ",
      Markup.inlineKeyboard([Markup.button.callback("Изменить Pitch", "set_pith"), Markup.button.callback("Меню", "menu")], {
        columns: 3,
      }).resize()
    );
  })

  bot.action("characters", async (ctx) => {
    
    try{
    ;
    const categoryButtons = Object.keys(groupedCharacters).map((category, index) => {
      return Markup.button.callback(category, `category-${index}`);
    });

    await ctx.reply(
      "Выберите категорию:",
      Markup.inlineKeyboard([...categoryButtons, Markup.button.callback("Назад", "menu")], {
        columns: 3,
      }).resize()
    );
}catch(e){ctx.reply("Произшла ошибка, введите /start что бы начать сначала")}});
try{
  Object.entries(groupedCharacters).forEach(([category, charactersInCategory], categoryIndex) => {
    
    bot.action(`category-${categoryIndex}`, async (ctx) => {
      
      ctx.session.currentCategoryIndex = categoryIndex
      const characterButtons = charactersInCategory.map((character, index) => {
        return Markup.button.callback(character.name, `character-${categoryIndex}-${index}`);
      });

      await ctx.reply(
        'Выберите персонажа:',
        Markup.inlineKeyboard([...characterButtons, Markup.button.callback("Назад", "characters")], {
          columns: 2,
        }).resize()
      );
    });

    charactersInCategory.forEach((character, characterIndex) => {
      bot.action(`character-${categoryIndex}-${characterIndex}`, async (ctx) => {
        

        ctx.session.model_path = character.model_path;
        ctx.session.index_path = character.index_path;
        ctx.session.char_photo = character.char_photo;
        ctx.session.name = character.name;
        ctx.session.gender = character.gender;
        ctx.session.audio_sample = character.audio_sample;

        console.log(character.audio_sample)

        const photo = { source: fs.readFileSync(character.char_photo) };
        const caption = `*${character.name}*\n${character.description}\nПол: ${character.gender}`;
        let audio_sample;

        if (character.audio_sample) {
          audio_sample = { source: fs.readFileSync(character.audio_sample) };
        }




        try{
        // Удаление предыдущего сообщения с фотографией
        if (ctx.session.prevMessageId) {
          await ctx.deleteMessage(ctx.session.prevMessageId);
        }
      }catch(err){
        console.log("err")
      }

        // Отправка нового сообщения с фотографией и обновленным заголовком
        const newMessage = await ctx.replyWithPhoto(
          photo,
          {
            caption,
            parse_mode: "Markdown",
          }
        );

        console.log(audio_sample)
        if (audio_sample) {
          await ctx.replyWithAudio(audio_sample, { caption: 'Пример голоса' });
        }

        // Отправка сообщения с кнопками
        await ctx.reply(
          "Выберите свой пол: (Нужно для правильной обработки голоса)",
          Markup.inlineKeyboard([
            [
              Markup.button.callback("Выбрать (я парень)", "select_male"),
              Markup.button.callback("Выбрать (я девушка)", "select_female"),
            ],
            [Markup.button.callback("Назад", "about_back")],
          ]).resize()
        );

        // Сохранение идентификатора нового сообщения в сессии
        ctx.session.prevMessageId = newMessage.message_id;
      });
    });

})}catch(e){console.log(e)};



  bot.action("select_male", async (ctx) => {
    
    ctx.session.pith = ctx.session.gender.trim() === "male" ? 0 : ctx.session.gender.trim() === "female" ? 12 : 6;

    if (ctx.session.gender === "male") {
      ctx.session.voiceActor = getRandomMaleVoice();
    } else {
      ctx.session.voiceActor = getRandomFemaleVoice();
    }

    ctx.session.voice_preset = "male"
    await ctx.reply(
      "Персонаж выбран, теперь записывай голосовое и получишь чудо!",
      Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
        columns: 3,
      }).resize()
    );
  });

  bot.action("select_female", async (ctx) => {
    
    ctx.session.pith = ctx.session.gender.trim() === "female" ? 0 : ctx.session.gender.trim() === "male" ? -12 : -6;


    if (ctx.session.gender.trim() === "male") {
      ctx.session.voiceActor = getRandomMaleVoice();
    } else {
      ctx.session.voiceActor = getRandomFemaleVoice();
    }

    ctx.session.voice_preset = "female"
    await ctx.reply(
      "Персонаж выбран, теперь записывай голосовое и получишь чудо!",
      Markup.inlineKeyboard([Markup.button.callback("Меню", "menu")], {
        columns: 3,
      }).resize()
    );
  });

  bot.action("back", async (ctx) => {
    try{
    const categoryButtons = Object.keys(groupedCharacters).map((category, index) => {
      return Markup.button.callback(category, `category-${index}`);
    });

    await ctx.reply(
      "Выберите категорию персонажей:",
      Markup.inlineKeyboard([...categoryButtons], {
        columns: 2,
      }).resize()
    );
    }catch(err){ctx.reply("Что-то пошлоне так, введите /start и начните с начала")}
});

  bot.action("about_back", async (ctx) => {
    try{
    const charactersInCategory = Object.values(groupedCharacters)[ctx.session.currentCategoryIndex];
    const characterButtons = charactersInCategory.map((character, index) => {
      return Markup.button.callback(character.name, `character-${ctx.session.currentCategoryIndex}-${index}`);
    });

    await ctx.reply(
      "Выберите персонажа:",
      Markup.inlineKeyboard([...characterButtons, Markup.button.callback("Назад", "back")], {
        columns: 3,
      }).resize()
    );
    }catch(err){ctx.reply("Что-то пошло не так, введите /start и начните с начала")}
  });


  bot.action("settings", async (ctx) => {
    
    await showSettings(ctx);
  });

  bot.action("aisettings", async (ctx) => {
    
    await showAICoverSettings(ctx);
  });

  bot.action("set_pith", async (ctx) => {
    
    ctx.session.settingPith = true;
    await ctx.reply("Введите значение Pith от -14 до 14:");
    await ctx.answerCbQuery();
    ;
  });

  bot.action("set_vocal_volume", async (ctx) => {
    
    ctx.session.settingVocalVolume = true;
    await ctx.reply("Введите громкость вокала для ИИ кавера от 0 до 3, где 1 стандартное значение");
    await ctx.answerCbQuery();

  })

  bot.action("set_instrumental_volume", async (ctx) => {
    
    ctx.session.settingInstrumentVolume = true;
    await ctx.reply("Введите громкость инструментала для ИИ кавера от 0 до 3, где 1 стандартное значение");
    await ctx.answerCbQuery();
  })

  bot.action("set_voice_speed", async (ctx) => {
    
    ctx.session.settingVoiceSpeed = true;
    await ctx.reply("Введите скорость речи для режима текст в звук");
    await ctx.answerCbQuery();
  })

 

  bot.action("set_out_voice", async (ctx) => {
    
    const outputKey = Markup.inlineKeyboard([
      Markup.button.callback("voice", "output_voice"),
      Markup.button.callback("audio", "output_audio"),
    ]).resize();
    await ctx.reply("Выберите тип аудио в ответ на ваше сообещние:", outputKey);
  });

  bot.action(/output_(voice|audio)/, async (ctx) => {
    
    const outputValue = ctx.match[1];
    ctx.session.voiceOrAudioOut = outputValue;
    await ctx.reply(
      `Тип сообщения установлен на ${outputValue}`,
      Markup.inlineKeyboard([Markup.button.callback("Назад", "settings")], {
        columns: 3,
      }).resize()
    );
    await ctx.answerCbQuery();
  });

  bot.action("set_method", async (ctx) => {
    
    const methodKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Harvest", "method_harvest"),
      Markup.button.callback("Crepe", "method_crepe"),
      Markup.button.callback("Mango-Crepe", "method_mangio-crepe"),
      Markup.button.callback("Rmvpe", "method_rmvpe"),
      Markup.button.callback("Rmvpe+", "method_rmvpeplus"), // Заменено "rmvpe+" на "rmvpeplus"
    ]).resize();
    await ctx.reply("Выберите метод:", methodKeyboard);
  });

  bot.action("support",async(ctx) =>{
    ctx.reply("Вы можете поддержать меня скинув небольшую денежку.\n\nЭто даст мне мотивацию работать над ботом и улучшать его.\n\nПоддержать создателя бота вы можете по этой ссылке.\nhttps://www.donationalerts.com/r/daswer123\nМожно по СБП: \n+79267154433\nМожно по номеру карты:\n5536913862883838", Markup.inlineKeyboard([
      Markup.button.callback('Меню', 'menu')
    ]))
  })

  bot.action(/method_(harvest|crepe|mangio-crepe|rmvpeplus|rmvpe)/, async (ctx) => { // Заменено "rmvpe+" на "rmvpeplus"
    
    console.log(ctx.match[1])
    let methodValue = ctx.match[1];
    if(methodValue === "rmvpeplus"){
      methodValue = "rmvpe+"
    }

    ctx.session.method = methodValue;

    await ctx.reply(
      `Method установлен на ${methodValue}`,
      Markup.inlineKeyboard([Markup.button.callback("Назад", "settings")], {
        columns: 3,
      }).resize()
    );
    await ctx.answerCbQuery();
  });

  bot.action("set_audio_process_power", async (ctx) => {
    const audioProcessPowerKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback("Nothing", "audio_process_power_nothing"), Markup.button.callback("Echo", "audio_process_power_echo")],
      [Markup.button.callback("Backvocal", "audio_process_power_backvocal"), Markup.button.callback("Both", "audio_process_power_both")],
    ]).resize();
    await ctx.reply(`
    Выберите уровень обработки аудио:\n\nМодификаторы при обработке вокала - есть 3 модификатора, echo - убрать эхо из вокала, backvocal - убрать бэк вокал и both - убрать и то и то\n\nnothing - ничего не делает с отделенным вокалом`
    , audioProcessPowerKeyboard);
  });
  
  bot.action(/audio_process_power_(nothing|echo|backvocal|both)/, async (ctx) => {
    const audioProcessPowerValue = ctx.match[1];
    ctx.session.audioProcessPower = audioProcessPowerValue;
    await ctx.reply(
      `Audio Process Power установлен на ${audioProcessPowerValue}`,
      Markup.inlineKeyboard([Markup.button.callback("Назад", "aisettings")], {
        columns: 3,
      }).resize()
    );
    await ctx.answerCbQuery();
  });

  bot.action("set_voice", async (ctx) => {
    ;

    await ctx.reply(`Выберите желаемый голос для создания голосовой болванки для вашего текста, что бы потом преобразовать её в голос персонажа\nAidar и Eugene мужские\nBaya более мягкий женский голос\nXenia - грубый женский голос\n остальные голоса женские`)
    const voiceKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("Aidar", "voice_aidar"),
        Markup.button.callback("Eugene", "voice_eugene"),
      ],
      [
        Markup.button.callback("Kseniya", "voice_kseniya"),
        Markup.button.callback("Xenia", "voice_xenia"),
      ],
      [Markup.button.callback("Baya", "voice_baya"), Markup.button.callback("Назад", "settings")],
    ]).resize();
    await ctx.reply("Выберите голос:", voiceKeyboard);
  });

  const VOICES = [
    { name: "Aidar", id: "aidar" },
    { name: "Baya", id: "baya" },
    { name: "Kseniya", id: "kseniya" },
    { name: "Xenia", id: "xenia" },
    { name: "Eugene", id: "eugene" },
  ];

  bot.action(/voice_(.*)/, async (ctx) => {
    const voiceId = ctx.match[1];
    const voice = VOICES.find((v) => v.id === voiceId);
    if (!voice) {
      await ctx.reply("Голос не найден");
      return;
    }

    ctx.session.voiceActor = voice.id;

    await ctx.reply(
      `Текстовый голос установлен на ${voice.name}`,
      Markup.inlineKeyboard([Markup.button.callback("Назад", "settings")], {
        columns: 3,
      }).resize()
    );
    await ctx.answerCbQuery();

    // // сгенерировать inline кнопки для выбора голоса
    // const buttons = VOICES.map((v) =>
    //   Markup.button.callback(v.name, `voice_${v.id}`)
    // );

    // await ctx.reply("Выберите голос:", Markup.inlineKeyboard(buttons).resize());
  });

  bot.action("set_mangio_crepe_hop", async (ctx) => {
    
    ctx.session.settingMangioCrepeHop = true;
    await ctx.reply("Введите значение Mangio-Crepe Hop от 64 до 250:");
    await ctx.answerCbQuery();
    ;
  });

  bot.action("set_feature_ratio", async (ctx) => {
    
    ctx.session.settingFeatureRatio = true;
    await ctx.reply("Введите значение feature ratio от 0 до 1:");
    await ctx.answerCbQuery();
    ;
  });

  bot.action("set_protect_voiceless", async (ctx) => {
    
    ctx.session.settingProtectVoiceless = true;
    await ctx.reply("Введите значение Protect voiceless от 0 до 0.5:");
    await ctx.answerCbQuery();
    ;
  });


  bot.action("separate", async (ctx) => {
    try{
    // Перед сохранением пресета, спросим у пользователя имя для пресета
    ctx.reply('Дополнительные настройки вы можете найти во вкладке, настройки AI кавера\n\nКиньте ссылку на ютуб или загрузите аудио напрямую, что бы разделить вокал и инструментал.');
    ctx.session.waitForSeparate = true
    }catch(e){console.log(e)}
  })

}
