@echo off
@chcp 65001

::call local_path.bat

cd libs

python -m venv venv
call venv/Scripts/activate

cd audio_separator
echo Установка Pythoch
python ../../utils/install_pytorch.py
echo Установка зависимостей для audio_separator
pip install -r requirements.txt

cd ..
cd rvc
echo Установка зависимостей для rvc
pip install -r requirements.txt

echo Установка зависимостей для silero-tts
cd..
cd siero-tts-server
start install.bat

cd ../../
cd utils
echo Скачивание hubert_base и rmvpe для RVC
python utils\dowload_rvc_base.py

echo Скачивание hubert_base и rmvpe для RVC
python utils\dowload_uvr_models.py

cd ..
cd main
npm install