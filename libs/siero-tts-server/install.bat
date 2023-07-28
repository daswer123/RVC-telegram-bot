@echo off
@chcp 65001

python -m venv venv

set local_path_bat="../../local_path.bat"

if exist "%local_path_bat%" (
    echo %local_path_bat% найден. Использование локальной среды.
    call %local_path_bat%
) else (
    echo %local_path_bat% не найден. Использование глобальной среды.
)

call venv\Scripts\activate
pip install silero-api-server==0.2.3

python replace_tts.py

pause