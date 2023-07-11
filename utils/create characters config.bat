@echo off
@chcp 65001

call ../local_path.bat

python create_characters_config.py "../MODELS"
echo Файл с персонажами создан

cd ../MODELS
copy "characters.json" "..\main\config"
del "characters.json"

echo Файл characters.json успешно перенесен.

pause