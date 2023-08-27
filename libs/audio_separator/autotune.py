import numpy as np
import librosa
from doremi.doremi import tune
import soundfile as sf
from pydub import AudioSegment
import argparse
import os


def estimate_key(file_path):
    y, sr = librosa.load(file_path)
    cqt = np.abs(librosa.cqt(y, sr=sr, bins_per_octave=36, n_bins=7*36, tuning=0.0))
    chroma = librosa.feature.chroma_cqt(C=cqt, n_chroma=12, n_octaves=7)
    key = np.argmax(np.sum(chroma, axis=1))
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    return notes[key]

def estimate_scale(file_path):
    y, sr = librosa.load(file_path)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma = np.mean(chroma, axis=1)
    major = np.correlate(chroma, np.array([1,0,0,0,1,0,0,1,0,0,0,0]))
    minor = np.correlate(chroma, np.array([1,0,0,1,0,0,0,1,0,0,0,0]))
    if np.sum(major) > np.sum(minor):
        return 'major'
    else:
        return 'minor'
    
def main():
    parser = argparse.ArgumentParser(description='Tune vocals to match instrumental.')
    parser.add_argument('instrumental', help='Path to the instrumental audio file.')
    parser.add_argument('vocal', help='Path to the vocal audio file.')
    parser.add_argument('output', help='Path to the output audio file.')
    parser.add_argument('attack', type=float, default=0.1, nargs='?', help='The attack of the tuning effect.')
    parser.add_argument('strength', type=float, default=0.9, nargs='?', help='The strength of the tuning effect.')

    args = parser.parse_args()

    # Определение ключа и масштаба инструментала
    key = estimate_key(args.instrumental)
    scale = estimate_scale(args.instrumental)

    # Загрузка и преобразование аудиофайла в моно
    y, sr = librosa.load(args.vocal, sr=None, mono=True, offset=0.0, duration=None, dtype=np.float32, res_type='kaiser_best')
    
    # Получение директории из args.vocal
    voc_dir = os.path.dirname(args.vocal)
    
    # Сохранение моно аудиофайла с высоким качеством
    mono_path = os.path.join(voc_dir, "ready.wav")
    sf.write(mono_path, y, sr, 'PCM_24')
    
    # Применение автотюна к моно аудиофайлу с сохранением высокого качества
    tune(mono_path, "tuned_vocal.wav", key=key, scale=scale,attack=args.attack, strength=args.strength)
    tuned_vocal_path = os.path.join(voc_dir, "tuned_vocal.wav")
    
    # Загрузка отрегулированного вокала и сохранение в формате MP3 с высоким качеством
    tuned_vocal = AudioSegment.from_file(tuned_vocal_path)
    tuned_vocal.export(args.output, format="mp3", bitrate="320k")

if __name__ == "__main__":
    main()


# tune("vocal_mono.wav", "tuned.wav", "D", "major")
