@echo off
@chcp 65001

call ../local_path.bat

python create_config.py

echo Конфиг создан

copy "default.json" "..\main\config"
del "default.json"

echo Конфиг успешно установлен.
pause