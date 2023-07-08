import os
import sys
import urllib.request

def download_file(url, local_path):
    if os.path.exists(local_path):
        print(f"Файл {local_path} уже существует.")
    else:
        print(f"Файл {local_path} отсутствует. Загрузка файла...")
        urllib.request.urlretrieve(url, local_path)
        print(f"Файл {local_path} успешно загружен.")

def main():
    if len(sys.argv) != 2:
        print("Использование: python dowload_hubert.py <путь_к_файлу>")
        sys.exit(1)

    local_path = sys.argv[1]
    url = "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/hubert_base.pt"

    download_file(url, local_path)

if __name__ == "__main__":
    main()