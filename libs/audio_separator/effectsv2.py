import argparse
import os
from pedalboard import (
    Pedalboard, 
    LowpassFilter, 
    HighpassFilter, 
    NoiseGate, 
    Compressor, 
    Reverb, 
    Delay, 
    Chorus, 
    PitchShift,

)
from pedalboard.io import AudioFile
from pydub import AudioSegment, silence

def str2bool(v):
    if isinstance(v, bool):
       return v
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise argparse.ArgumentTypeError('Boolean value expected.')

def process_audio(args):
    # Create a Pedalboard object:
    board = Pedalboard([])

    # Add effects to Pedalboard, if they are enabled:
    if args.highPassOn:
        board.append(HighpassFilter(cutoff_frequency_hz=args.highpassCutoff))
    if args.lowPassOn:
        board.append(LowpassFilter(cutoff_frequency_hz=args.lowpassCutoff))
    if args.noiseGateOn:
        board.append(NoiseGate(threshold_db=args.noiseGateThreshold))
    if args.compressorOn:
        board.append(Compressor(threshold_db=args.compressorThreshold, ratio=args.compressorRatio))
    if args.reverbOn:
        board.append(Reverb(room_size=args.reverbRoomSize, wet_level=args.reverbWetLevel))
    if args.delayOn:
        board.append(Delay(delay_seconds=args.delayTime, mix=args.delayMix))
    if args.chorusOn:
        board.append(Chorus(rate_hz=args.chorusRate, depth=args.chorusDepth))
    if args.pitchShiftOn:
        board.append(PitchShift(semitones=args.pitchShift))

    # Загрузите исходный аудиофайл:
    audio = AudioSegment.from_file(args.input_file)

    # Добавьте 1 секунду тишины в конец:
    silence = AudioSegment.silent(duration=1500)  # duration is in milliseconds
    audio_with_silence = audio + silence

    # Получите путь к папке исходного файла:
    input_folder = os.path.dirname(os.path.abspath(args.input_file))

    # Сохраните новый аудиофайл в ту же папку:
    new_input_file = os.path.join(input_folder, "input_with_silence.wav")
    audio_with_silence.export(new_input_file, format="wav")

    # Откройте аудиофайл для чтения, как обычный файл:
    with AudioFile(new_input_file) as f:
    
        print("Input file opened, starting processing...")
    
        # Прочитайте весь аудиофайл:
        audio = f.read(f.frames)
    
        # Запустите аудио через нашу педальную доску:
        effected = board(audio, f.samplerate, reset=False)
    
        # Сохраните samplerate и num_channels для последующего использования
        samplerate = f.samplerate
        num_channels = f.num_channels
    print("Audio processing finished.")
    
    # Запишите обработанное аудио в файл:
    with AudioFile("temp.wav", 'w', samplerate, num_channels) as o:
        o.write(effected)
    # Загрузите выходной файл:
    audio = AudioSegment.from_wav("temp.wav")
    
    # Экспортируйте его в формат MP3:
    audio.export(args.output_file, format="mp3")
    
    # Удаляем временный файл
    os.remove("temp.wav")



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process audio with effects.')
    parser.add_argument('--input_file', required=True, help='Input audio file')
    parser.add_argument('--output_file', required=True, help='Output audio file')
    parser.add_argument('--compressorThreshold', type=float, default=0)
    parser.add_argument('--compressorRatio', type=float, default=1)
    parser.add_argument('--highpassCutoff', type=float, default=50)
    parser.add_argument('--lowpassCutoff', type=float, default=50)
    parser.add_argument('--noiseGateThreshold', type=float, default=-100)
    parser.add_argument('--chorusRate', type=float, default=1.0)
    parser.add_argument('--chorusDepth', type=float, default=0.25)
    parser.add_argument('--reverbRoomSize', type=float, default=0.5)
    parser.add_argument('--reverbWetLevel', type=float, default=0.33)
    parser.add_argument('--delayTime', type=float, default=0.5)
    parser.add_argument('--delayMix', type=float, default=0.5)
    parser.add_argument('--pitchShift', type=float, default=0)
    parser.add_argument('--chorusOn', type=str2bool, default=False)
    parser.add_argument('--reverbOn', type=str2bool, default=False)
    parser.add_argument('--delayOn', type=str2bool, default=False)
    parser.add_argument('--pitchShiftOn', type=str2bool, default=False)
    parser.add_argument('--noiseGateOn', type=str2bool, default=False)
    parser.add_argument('--highPassOn', type=str2bool, default=False)
    parser.add_argument('--lowPassOn', type=str2bool, default=False)
    parser.add_argument('--compressorOn', type=str2bool, default=False)

    args = parser.parse_args()
    process_audio(args)