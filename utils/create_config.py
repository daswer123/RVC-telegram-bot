import json 
import os

telegram_token = input("Введите Telegram токен: ")

# Получаем путь к текущему скрипту  
script_path = os.path.realpath(__file__)   

# Вычисляем путь родительской и предыдущей папок 
script_dir = os.path.dirname(script_path) 
base_dir = os.path.dirname(script_dir)
libs_dir = os.path.join(base_dir, "libs")
# dir3 = os.path.dirname(base_dir)

# Берем папки на 3 уровня ниже  
rvc_path = os.path.join(libs_dir, "rvc")  
audio_sep_path = os.path.join(libs_dir , "audio_separator")  
main_path = os.path.join(base_dir , "main")

# Формируем остальные пути  
rvc_venv_path = os.path.join(libs_dir, "venv", "Scripts", "python")
audio_sep_venv_path = os.path.join(libs_dir, "venv", "Scripts", "python")  
char_path = os.path.join(main_path,"config")

data = {
    "TELEGRAM_TOKEN": telegram_token,
    "PYTHON_VENV_PATH" : rvc_venv_path, 
    "RVC_SCRIPT_PATH" : rvc_path,
    "PYTHON_VENV_SEP_PATH": audio_sep_venv_path,
    "AUDIO_SEP_PATH": audio_sep_path, 
    "MAIN_PATH": main_path,
    "CHARACTER_PATH": char_path
}

with open("default.json", "w") as f: 
    json.dump(data, f, indent=4)