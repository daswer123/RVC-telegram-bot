@echo off
@chcp 65001

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

cd ../../
echo Скачивание hubert_base для RVC
python utils\dowload_hubert.py .\main\hubert_base.pt

cd main
npm install