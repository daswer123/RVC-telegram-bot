import argparse
import numpy as np
import librosa
from scipy.signal import butter, lfilter, iirnotch
import soundfile as sf
from pydub import AudioSegment, effects
from scipy.ndimage import gaussian_filter1d
import array
import scipy.signal as sp
import os
from tqdm import tqdm

def add_echo(signal, sr, delay_sec=0.3, attenuation=0.1):
    delay_samples = int(delay_sec * sr)
    echo_signal = np.zeros(len(signal) + delay_samples)
    echo_signal[:len(signal)] += signal
    echo_signal[delay_samples:] += signal * attenuation
    echo_signal = echo_signal[:len(signal)]
    echo_signal /= np.abs(echo_signal).max()
    return echo_signal

def apply_reverb(signal, impulse_response, dry_wet_ratio = 0.0005):
    impulse_response = impulse_response / np.sum(impulse_response)
    padded_signal = np.pad(signal, (0, len(impulse_response) - 1), 'constant')
    padded_impulse = np.pad(impulse_response, (0, len(signal) - 1), 'constant')
    signal_fft = np.fft.fft(padded_signal)
    impulse_fft = np.fft.fft(padded_impulse)
    convolved_fft = signal_fft * impulse_fft
    reverb_signal = np.real(np.fft.ifft(convolved_fft))
    reverb_signal = reverb_signal[:len(signal)]
    reverb_signal = (1 - dry_wet_ratio) * signal + dry_wet_ratio * reverb_signal
    return reverb_signal

def process_audio(args):
    y, sr = librosa.load(args.input, sr=None)

    if args.all or args.echo:
        y = add_echo(y, sr, delay_sec=args.echo_delay, attenuation=args.echo_attenuation)
    if args.all or args.reverb:
        impulse_response, _ = librosa.load('impulse.wav', sr=sr)
        y = apply_reverb(y, impulse_response, dry_wet_ratio=args.reverb_ratio)

    output = y + y[:len(y)]
    output = librosa.util.normalize(output, norm=np.inf, axis=None)
    output = (output * np.iinfo(np.int16).max).astype(np.int16)
    temp_file_path = os.path.splitext(args.input)[0] + '_temp.wav'
    sf.write(temp_file_path, output, sr, subtype='PCM_16')

    audio = AudioSegment.from_wav(temp_file_path)
    audio.export(args.output, format='mp3')
    os.remove(temp_file_path)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Apply audio effects.')
    parser.add_argument('input', help='Input audio file')
    parser.add_argument('output', help='Output audio file')
    parser.add_argument('--all', action='store_true', help='Apply all effects')
    parser.add_argument('--echo', action='store_true', help='Apply echo effect')
    parser.add_argument('--reverb', action='store_true', help='Apply reverb')
    parser.add_argument('--echo-delay', type=float, default=0.3, help='Delay for echo effect')
    parser.add_argument('--echo-attenuation', type=float, default=0.1, help='Attenuation for echo effect')
    parser.add_argument('--reverb-ratio', type=float, default=0.0005, help='Dry/Wet ratio for reverb effect')

    args = parser.parse_args()

    process_audio(args)