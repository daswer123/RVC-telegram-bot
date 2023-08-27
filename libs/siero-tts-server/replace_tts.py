import os
import shutil

# Определите путь к исходному файлу и целевой директории
source_file = 'tts.py'
target_dir = os.path.join('venv\Lib\site-packages\silero_api_server')

# Проверьте, существует ли исходный файл
if not os.path.exists(source_file):
    print(f"Исходный файл {source_file} не существует. Операция перемещения не будет выполнена.")
else:
    # Проверьте, существует ли целевая директория
    if not os.path.exists(target_dir):
        print(f"Целевая директория {target_dir} не существует.")
    else:
        # Путь к целевому файлу
        target_file = os.path.join(target_dir, 'tts.py')

        # Если целевой файл уже существует, удалите его
        if os.path.exists(target_file):
            os.remove(target_file)

        # Перемещение файла
        shutil.move(source_file, target_file)

        print(f"Файл {source_file} успешно перемещен в {target_file}.")