import os
import re
import subprocess
import sys

def get_cuda_version():
    try:
        nvcc_version = subprocess.check_output(["nvcc", "--version"]).decode("utf-8")
        match = re.search(r"release (\d+\.\d+)", nvcc_version)
        if match:
            return match.group(1)
        else:
            print("Не удалось определить версию CUDA. Устанавливаем CPU-версию PyTorch.")
            return None
    except FileNotFoundError:
        print("Команда nvcc не найдена. Устанавливаем CPU-версию PyTorch.")
        return None

def install_pytorch(cuda_version):
    if cuda_version == "11.6":
        command = "pip install torch==1.13.1+cu116 torchvision==0.14.1+cu116 --extra-index-url https://download.pytorch.org/whl/cu116"
    elif cuda_version == "11.7":
        command = "pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu117"
    elif cuda_version == "11.8":
        command = "pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118"
    elif cuda_version is None:
        command = "pip3 install torch torchvision torchaudio"
    else:
        print(f"У вас установлена версия CUDA {cuda_version}, которая не поддерживается данным скриптом. Устанавливаем CPU-версию PyTorch.")
        command = "pip3 install torch torchvision torchaudio"

    result = os.system(command)
    if result != 0:
        print("Ошибка при установке PyTorch. Проверьте свою систему и команду установки.")

def main():
    cuda_version = get_cuda_version()
    print(f"Установленная версия CUDA: {cuda_version}" if cuda_version else "CUDA не найдена")
    install_pytorch(cuda_version)

if __name__ == "__main__":
    main()