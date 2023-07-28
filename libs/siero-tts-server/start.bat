@echo off
@chcp 65001

set local_path_bat="../../local_path.bat"

if exist "%local_path_bat%" (
    echo %local_path_bat% найден. Использование локальной среды.
    call %local_path_bat%
) else (
    echo %local_path_bat% не найден. Использование глобальной среды.
)

call ../venv/scripts/activate
pip install loguru==0.7.0

python -m server.py-p 8010
pause