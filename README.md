# Telegram бот, который преобразует голос с помощью rvc

Данный бот в телеграмме может принять любой аудиофайл, голосовое сообщение или видео и преобразовать голос с помощью RVC. 

Демонстрацию возможностей бота вы можете посмотреть [тут](https://t.me/mister_parodist_rvc_bot)

## Пак голосов
Недавно я выложил свой пак голосов ( 250 штук ), который собирал ~ 2,5 месяца. В основном русские голоса, но встречаются и англоязычные и японские.
https://huggingface.co/Daswer123/rvc_big_voice_pack

## Ключевые особенности
- Быстрое преобразование голоса
- Возможность автоматически создавать AI каверы, достаточно отправить песню или сылку на ютуб
- Возможность озвучить текст голосом любого персонажа ( Yandex + Silero )
- Тонкая настройка голоса и создания AI кавера
- Большое кол-во эффектов для пред и пост обработки ( Эхо, реверб, автотюн, компресия )
- Отдельная возможность разделить песню на вокал и инструментал, так же отделить несколько инструментов или избавится от одного из них.
- Меню для сбора данных с пользователя, для дальнейшей тренировки пользовательской модели
- Возможность сохранять и загружать пресеты
- Пользователь может оставить предложение по улучшению на специальную кнопку
- Новые методы преобразования: Mangio-crepe, rmvpe и rmvpe+
- Возможность контролировать нагрузку и максимальное кол-во запросов в очереди

**Существует портативная версия бота, с уже установленными библиотеками [Portable TG RVC Bot](https://huggingface.co/Daswer123/RVC_TG_BOT/tree/main)**
Как только скачаете портативную версию, запустите update_path.bat и начните с пунка 5 в [Гайде по установке](https://github.com/daswer123/tg_rvc_bot/edit/main/README.md#гайд-по-установке)
В качестве бонуса в портативной версии, уже установленно несколько голосов для теста.

## DEMO ( Turn Sound on )

https://github.com/daswer123/RVC-telegram-bot/assets/22278673/ce3895d2-3208-470c-85f8-f59496cd8185

## Improved Verison ( Turn Sound on )

![image](https://github.com/daswer123/RVC-telegram-bot/assets/22278673/7098f31c-c6f3-40c5-ab19-c6ac53506516)

https://github.com/daswer123/RVC-telegram-bot/assets/22278673/f1ddca17-7fa6-478a-a320-8bf07dc6477d

Свяжитесь со мной если вас заинтересовала эта версия https://t.me/daswer123

## TODO
- [x] Разбить код на модули
- [x] Отделить серверную часть и бота
- [x] Добавить систему очередей
- [x] Добавить систему подписки
- [ ] Отрефакторить код ( частично )
- [x] Улучшить UI

## Гайд по установке:
1) Убедитесь что у вас установленны: [Python 3.10.x](https://www.python.org/downloads/release/python-3109/), [Node JS 18+](https://nodejs.org/dist/v18.16.1/node-v18.16.1-x64.msi), [Microsoft builders Tools 2019](https://visualstudio.microsoft.com/ru/visual-cpp-build-tools/) , [ffmpeg](https://ffmpeg.org/), [CUDA 11.7](https://developer.download.nvidia.com/compute/cuda/11.7.0/local_installers/cuda_11.7.0_516.01_windows.exe) или [CUDA 11.8](https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda_11.8.0_522.06_windows.exe)
2) Создаете бота в botFather
3) клонируете этот репозиторий
4) Запускаете `install.bat` в корневой папке
5) Пропускайте этот пункт, если вы не используете Portable. Запустите `update_path.bat` в корневой папке
6) Как только загрузка закончилась заходите в папку utils и запускаете `create main config.bat`, вам нужно будет указать ваш ключ к боту
6) Далее вы должны сформировать структуру ваших голосовых моделей, зайдите в папку MODELS и прочитайте [Readme](https://github.com/daswer123/tg_rvc_bot/tree/main/MODELS#readme), там указана примерная структура папок которая должна быть
   
![image](https://github.com/daswer123/tg_rvc_bot/assets/22278673/713ed830-cf18-4e3f-a4bf-6812b7d3dcdd)

7) Как вы создадите структуру голосовых моделей, запустите скрипт `create characters config.bat` в папке `utils`
8) Все готово! теперь запускайте `start.bat` и начинайте работать с ботом

# Примечания по работе бота
1) Как только добавите нового персонажа,  не забудьте снова запустить скрипт `create characters config.bat` в папке `utils`
2) Вы можете настроить кол-во одновременных запросов, которые ваш компьютер будет обрабатывать, так же вы можете отрегулировать максимальное кол-во запросов в очереди от пользователя. Ищите настройки в `server.js` и `variables.js`
3) Все сообщения от пользователей сохраняются в папке sessions
4) В боте исползуется Mangio-RVC-Fork
5) Бот был протестирован на Windows 10 , RTX 3090, Cuda 11.8

# Credit

1) [Mangio-RVC-Fork](https://github.com/Mangio621/Mangio-RVC-Fork) - Модифицированная версия RVC с новыми методами преобразования
2) [python-audio-separator](https://github.com/karaokenerds/python-audio-separator) - Разделение аудио на вокал и инструментал с помощью MDX архетектуры
3) [Silero TTS](https://github.com/snakers4/silero-models) - TTS на русском языке
4) [doremi](https://github.com/jpmchargue/doremi) - Библеотека для автотюна
5) [pedalboard](https://github.com/spotify/pedalboard) - Библеотека эффектов
6) [Demucs](https://github.com/facebookresearch/demucs) - Разделение аудио на вокал и инструментал

