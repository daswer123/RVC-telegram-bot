@echo off
@chcp 65001
cd libs

cd audio_separator
python -m venv venv
call venv/Scripts/activate
echo Установка Pythoch для audio_separator 
python ../../utils/install_pytorch.py
echo Установка зависимостей для audio_separator 
pip install -r requirements.txt
call venv/Scripts/deactivate

cd ..
cd rvc
python -m venv venv
call venv/Scripts/activate
echo Установка Pythoch для rvc
python ../../utils/install_pytorch.py
echo Установка зависимостей для rvc
pip install -r requirements.txt
call venv/Scripts/deactivate

cd ../../
echo Скачивание hubert_base для RVC
py utils\dowload_hubert.py .\main\hubert_base.pt

cd main
npm install
