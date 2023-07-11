@echo off
@chcp 65001

set local_path_bat=..\local_path.bat

if exist "%local_path_bat%" (
    echo local_path.bat найден. Использование локальной среды.
    call %local_path_bat%
) else (
    echo local_path.bat не найден. Использование глобальной среды.
)


python create_config.py

echo Конфиг создан

copy "default.json" "..\main\config"
del "default.json"

echo Конфиг успешно установлен.
pause