@echo off
cd ..
cd libs
cd rvc
call venv/Scripts/activate
pip uninstall torch torchaudio
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
call venv/Scripts/deactivate
cd ..
cd audio_separator
call venv/Scripts/activate
pip uninstall torch torchaudio
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118