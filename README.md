# Бот в Telegram, который конвертирует голос с помощью rvc

Этот бот в Telegram принимает ваши голосовые сообщения и конвертирует их с помощью rvc

DEMO
https://github.com/daswer123/tg_rvc_bot/assets/22278673/5c4b30d7-947d-43d1-baf4-f7637aabb1d6


# Гайд по установке:
1) Создаете бота в botFather
2) клонируете этот репозиторий
3) Далее нужно установить в папку rvc , сам rvc можно это сделать тут [RVC-beta](https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/RVC-beta.7z)
4) После того как скачаете распокуйте весь архив в папку rvc, убедитесь что файл test-infer.py остался на месте
5) Скопируйте hubert_base.pt из папки rvc в папку main
6) Далее нужно установить зависимости для rvc , для этого зайдите в папку rvc , наберите следущие команды в консоле открытой в папке rvc:
`python -m venv venv`
`venv/scripts/activate/`
`pip install -r requirements.txt`
7) После этого зайдите в конфиг в папке main\config\default.json измените все параметры по шаблону
8) Далее зайдите в папку MODELS и создайте модели согласно README внутри, у вас это будет выглядить примерно так^

![image](https://github.com/daswer123/tg_rvc_bot/assets/22278673/452d770b-1a53-4005-9e8f-9c539f6d3175)

![image](https://github.com/daswer123/tg_rvc_bot/assets/22278673/37bdb8f7-e162-4ed7-bd13-033657338342)

9) После того как вы перекинули все модели, запустите консоль в папке MODELS и введите команду
`python script.py`
У вас появится файл character.json
10) Переместите этот файл в папку main\src
11) Далее зайдите в  папку main, запустите консоль и введите следущие команды
`npm i`
12) Замените модель в файле main\src\variables.js на вашу из character.json в качестве дефолтной 
13) Готово теперь вы можете открыть консоль в папке main и запуститить бота через команду `npm run dev`


