@echo off
cd ..

set local_path_bat=local_path.bat

if exist "%local_path_bat%" (
    echo %local_path_bat% найден. Использование локальной среды.
    call %local_path_bat%
) else (
    echo %local_path_bat% не найден. Использование глобальной среды.
)

cd libs
call venv/Scripts/activate
pip uninstall torch torchaudio
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
