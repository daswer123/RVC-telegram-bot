import { Telegraf, Markup, session } from "telegraf";
import { message } from "telegraf/filters";
import { downloadFile, mergeAudioFilesToMp3 } from "./functions.js";
import config from "config";
import fs from "fs";

import {INITIAL_SESSION} from "./variables.js"
import { setBotCommands,registerBotCommands } from "./botCommands.js";
import { showMenu, processAudioMessage, is_youtube_url, process_youtube_audio, process_audio_file, sendMessageToAllUsers} from "./botFunction.js";
import { registerBotActions } from "./botActions.js";


export const bot = new Telegraf(config.get("TELEGRAM_TOKEN"), {handlerTimeout: 600_000});

bot.use(session());
setBotCommands(bot);

process.setMaxListeners(0);

registerBotCommands(bot)
registerBotActions(bot)


bot.on(message("text"), async (ctx) => {
    ctx.session ??= {...INITIAL_SESSION}
    if (is_youtube_url(ctx.message.text) && ctx.session.waitingForCover) {

      const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
      const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
      const sessionPath = `sessions/${uniqueId}/${messageId}`;
      // Если пользователь отправил YouTube URL и ожидается обложка
      const youtube_url = ctx.message.text;
  
      ctx.reply("Скачивание аудио с YouTube...");
      await process_youtube_audio(ctx, sessionPath, youtube_url);

      ctx.session.waitingForCover = false;
      return
    }
  
    if (ctx.session.settingPith || ctx.session.settingMangioCrepeHop || ctx.session.settingFeatureRatio || ctx.session.settingProtectVoiceless || ctx.session.settingVocalVolume || ctx.session.settingInstrumentVolume) {
      const value = parseFloat(ctx.message.text);
      let settingName, minValue, maxValue;
  
      if (ctx.session.settingPith) {
        settingName = "Pith";
        minValue = -14;
        maxValue = 14;
      } else if (ctx.session.settingMangioCrepeHop) {
        settingName = "Mangio-Crepe Hop";
        minValue = 64;
        maxValue = 250;
      } else if (ctx.session.settingFeatureRatio) {
        settingName = "Feature Ratio";
        minValue = 0;
        maxValue = 1;
      } else if (ctx.session.settingProtectVoiceless) {
        settingName = "Protect Voiceless";
        minValue = 0;
        maxValue = 0.5;
      } else if (ctx.session.settingVocalVolume) {
        settingName = "Voice volume";
        minValue = 0;
        maxValue = 3;
      } else if (ctx.session.settingInstrumentVolume) {
        settingName = "Instrumnet volume";
        minValue = 0;
        maxValue = 3;
      }
  
      if (value >= minValue && value <= maxValue) {
        ctx.session[settingName.toLowerCase().replace(/ /g, "_")] = value;

        console.log(settingName.toLowerCase().replace(/ /g, "_"))
        console.log(ctx.session[settingName.toLowerCase().replace(/ /g, "_")])

        ctx.session.settingPith = false;
        ctx.session.settingMangioCrepeHop = false;
        ctx.session.settingFeatureRatio = false;
        ctx.session.settingProtectVoiceless = false;
        ctx.session.settingVocalVolume = false;
        ctx.session.settingInstrumentVolume = false;

        await ctx.reply(
          `${settingName} установлен на ${value}`,
          Markup.inlineKeyboard([Markup.button.callback("Назад", "settings"),Markup.button.callback("Меню", "menu")], {
            columns: 3,
          }).resize()
        );
      } else {
        await ctx.reply(`Пожалуйста, введите корректное значение ${settingName} от ${minValue} до ${maxValue}`);
      }
    } else {
      await showMenu(ctx)

      if(ctx.session.mergeAudio || ctx.session.waitingForCover){
        ctx.session.mergeAudio = false;
        ctx.session.waitingForCover = false;

        await ctx.reply("Отмена операции")
      }
      
    }
    });

    bot.on("voice", async (ctx) => {
      ctx.session ??= {...INITIAL_SESSION}
      if(ctx.session.testVoice){
        for (let i=0;i<12;i++){
          ctx.session.pith = i;
          await ctx.reply("Текущая высота тона: "+i)
          await processAudioMessage(ctx)
        }
        ctx.session.testVoice = false
      }
      // добавляем голосовое сообщение в очередь
      ctx.state.voiceMessagesQueue = ctx.state.voiceMessagesQueue || [];
      ctx.state.voiceMessagesQueue.push(ctx);

      // если обработчик сообщений уже работает, не запускаем еще один
      if (ctx.state.processingVoiceMessages) {
        return
      };

      // обработка голосовых сообщений в очереди
      (async () => {
        ctx.state.processingVoiceMessages = true;

        while (ctx.state.voiceMessagesQueue.length > 0) {
          const nextCtx = ctx.state.voiceMessagesQueue.shift();
          await processAudioMessage(nextCtx);
        }

        ctx.state.processingVoiceMessages = false;
      })();
    });

    bot.on("audio", async (ctx) => {
      if (ctx.session.waitingForCover) {

        // добавляем голосовое сообщение в очередь
        ctx.state.voiceMessagesQueue = ctx.state.voiceMessagesQueue || [];
        ctx.state.voiceMessagesQueue.push(ctx);
    
        // если обработчик сообщений уже работает, не запускаем еще один
        if (ctx.state.processingVoiceMessages) {
          await ctx.reply("Создание кавера уже запущено у другово человека, подождите")
          return
        };
    
        // обработка голосовых сообщений в очереди
        (async () => {
          ctx.state.processingVoiceMessages = true;
    
          while (ctx.state.voiceMessagesQueue.length > 0) {
            const nextCtx = ctx.state.voiceMessagesQueue.shift();
            await processAiCover(nextCtx);
            ctx.session.waitingForCover = false;
          }
        
          ctx.state.processingVoiceMessages = false;
      })();

        
      } 
      else if (ctx.session.mergeAudio){
        ctx.session ??= { ...INITIAL_SESSION };
        const uniqueId = ctx.from.id; // получаем уникальный идентификатор пользователя
        const messageId = ctx.message.message_id; // получаем уникальный идентификатор сообщения
        const sessionPath = `sessions/${uniqueId}/${messageId}`;

        // создаем папку сессии, если она еще не существует
        if (!fs.existsSync(sessionPath)) {
          fs.mkdirSync(sessionPath, { recursive: true });
        }

        let link;

        link = await ctx.telegram.getFileLink(ctx.message.audio.file_id);

        if (!ctx.session.firstFile) {
          ctx.session.firstFile = `${sessionPath}/audio1.mp3`;
          await downloadFile(link, ctx.session.firstFile);
          // Запрашиваем второй файл
          ctx.reply('Пожалуйста, отправьте второй аудиофайл, это должен быть инструментал:');
        } else {
          ctx.session.secondFile = `${sessionPath}/audio2.mp3`;
          await downloadFile(link, ctx.session.secondFile);
        
          // Смешиваем аудиофайлы и сохраняем результат в файле MP3
          const outputFile = `${sessionPath}/merged.mp3`;
          ctx.reply("Склеиваем вокал и интрументал...")
          await mergeAudioFilesToMp3(ctx.session.firstFile, ctx.session.secondFile, outputFile,ctx);
        
          // Отправляем смешанный аудиофайл пользователю
          await ctx.replyWithAudio({ source: fs.createReadStream(outputFile) });
        
          // Сбрасываем состояние сессии
          ctx.session.firstFile = null;
          ctx.session.secondFile = null;
}

      }
      else {
        // добавляем голосовое сообщение в очередь
        ctx.state.voiceMessagesQueue = ctx.state.voiceMessagesQueue || [];
        ctx.state.voiceMessagesQueue.push(ctx);

        // если обработчик сообщений уже работает, не запускаем еще один
        if (ctx.state.processingVoiceMessages) return;

        // обработка голосовых сообщений в очереди
        (async () => {
          ctx.state.processingVoiceMessages = true;
        
          while (ctx.state.voiceMessagesQueue.length > 0) {
            const nextCtx = ctx.state.voiceMessagesQueue.shift();
            await processAudioMessage(nextCtx, true);
          }
        
          ctx.state.processingVoiceMessages = false;
        })();
      }
      
    });
    

bot.launch();

// Restart msg
sendMessageToAllUsers("Бот был перезапущен, введите /start для начала работы",bot)

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));