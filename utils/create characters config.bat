@echo off
@chcp 65001

set local_path_bat=..\local_path.bat

if exist "%local_path_bat%" (
    echo local_path.bat найден. Использование локальной среды.
    call %local_path_bat%
) else (
    echo local_path.bat не найден. Использование глобальной среды.
)

python create_characters_config.py "../MODELS"
echo Файл с персонажами создан

cd ../MODELS
copy "characters.json" "..\main\config"
del "characters.json"

echo Файл characters.json успешно перенесен.

pause