@echo off
cd ..
cd libs
call venv/Scripts/activate
pip uninstall torch torchaudio
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
