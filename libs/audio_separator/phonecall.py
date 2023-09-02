import argparse
from pedalboard import Pedalboard, HighpassFilter, LowpassFilter
from pedalboard.io import AudioFile

def process_audio(input_file, output_file, min_freq=500, max_freq=2000):
    # Создайте объект Pedalboard, содержащий несколько аудио-плагинов:
    board = Pedalboard([
        HighpassFilter(cutoff_frequency_hz=min_freq),  # обрезать частоты ниже min_freq Hz
        LowpassFilter(cutoff_frequency_hz=max_freq),  # обрезать частоты выше max_freq Hz
    ])

    # Откройте аудиофайл для чтения, как обычный файл:
    with AudioFile(input_file) as f:

      # Откройте аудиофайл для записи:
      with AudioFile(output_file, 'w', f.samplerate, f.num_channels) as o:

        # Прочитайте одну секунду аудио за раз, пока файл не опустеет:
        while f.tell() < f.frames:
          chunk = f.read(f.samplerate)

          # Запустите аудио через нашу педальную доску:
          effected = board(chunk, f.samplerate, reset=False)

          # Запишите вывод в наш выходной файл:
          o.write(effected)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process audio file to sound like a phone call.')
    parser.add_argument('input_file', type=str, help='Input audio file')
    parser.add_argument('output_file', type=str, help='Output audio file')
    parser.add_argument('--min_freq', type=int, default=500, help='Minimum frequency cutoff in Hz')
    parser.add_argument('--max_freq', type=int, default=1500, help='Maximum frequency cutoff in Hz')

    args = parser.parse_args()

    process_audio(args.input_file, args.output_file, args.min_freq, args.max_freq)