import math
import numpy as np

from .util import LerpArray, PitchMarkers

def sweep_pitch_algorithm(frames, precision_hz=1.0):
    """
    Creates a LerpArray of pitch frequencies and a LerpArray of 
    harmonic energies for each frame.
    I developed this pitch-detection algorithm as part of my master's thesis
    after running into problems with autocorrelation and cepstral pitch detection.
    A detailed description of the algorithm can be found in my thesis here:
    (http://rave.ohiolink.edu/etdc/view?acc_num=case1682441774337466)
    """
    f_min, f_max = 50, 1000
    bins_hz = frames.sr / frames.window_length
    bins_min, bins_max = math.floor(f_min / bins_hz), math.ceil(f_max / bins_hz) + 1
    bins_precision = precision_hz / round(bins_hz)

    def sweep_frequencies(spectrum):
        bins_stop = min(bins_max, len(spectrum))
        threshold = np.average(spectrum.fx)
        best_bins, best_power = bins_min, 0
        for j in np.arange(bins_min, bins_stop, bins_precision):
            total_power = 0
            pointer = j
            while pointer < len(spectrum) and spectrum[pointer] > threshold:
                total_power += spectrum[pointer]
                pointer += j
            if total_power > best_power:
                best_bins, best_power = j, total_power

        best_frequency = best_bins * bins_hz
        return best_frequency, best_power

    pitches, energies = [], []
    for frame in frames.frames:
        board = np.abs(np.fft.fft(frame)[:bins_max])
        spectrum = LerpArray(board)
        p, e = sweep_frequencies(spectrum)
        pitches.append(p)
        energies.append(e)

    return LerpArray(pitches), LerpArray(energies)

def get_pitch_markers(frames, frame_pitches):
    pitch_markers, pitch_markers_f = [], []
    i = 0
    while i < len(frames.signal):
        f_i = frame_pitches[frames.get_frame_index(i)]
        hop = round(frames.sr / f_i)
        i += hop
        pitch_markers.append(i)
        pitch_markers_f.append(f_i)
    return PitchMarkers(pitch_markers, pitch_markers_f)

def tune_pitches(pitches, tonic="C", scale='major'):
    """
    Creates a new LerpArray of pitches that contains the pitches in 'pitches'
    shifted to their perceptually closest frequency in the given key and scale.
    """
    tonic_frequencies = {
        "A": 440.0,
        "A#": 466.16,
        "Bb": 466.16,
        "B": 493.88,
        "B#": 523.25,
        "Cb": 493.88,
        "C": 523.25,
        "C#": 554.37,
        "Db": 554.37,
        "D": 587.33,
        "D#": 622.25,
        "Eb": 622.25,
        "E": 659.25,
        "E#": 698.46,
        "Fb": 659.25,
        "F": 698.46,
        "F#": 739.99,
        "Gb": 739.99,
        "G": 783.99,
        "G#": 830.61,
        "Ab": 830.61,
    }
    scales = {
        "major": [0, 2, 4, 5, 7, 9, 11, 12],
        "minor": [0, 2, 3, 5, 7, 8, 10, 12],
        "chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        "pentatonic": [0, 2, 4, 7, 9, 12]
    }

    if type(tonic) == str:
        tonic_f = tonic_frequencies[tonic] if tonic in tonic_frequencies else 440.0
    else:
        tonic_f = tonic
    scale_tones = np.array(scales[scale])

    twelfth_root_two = 2**(1/12)
    log_pitches = np.log(pitches.fx/tonic_f)/np.log(twelfth_root_two)
    octave, tones = log_pitches // 12, log_pitches % 12
    closest_scale_tones = scale_tones[np.argmin(np.abs(np.expand_dims(tones, axis=1) - scale_tones), axis=1)]
    tuned_pitches = tonic_f * (twelfth_root_two**((octave * 12) + closest_scale_tones))

    return LerpArray(tuned_pitches)

def smooth_pitches(pitches, minimum_frames=4):
    """
    Smoothes the target pitches of an autotuned sound.
    If a target pitch is held for a segment of fewer than 'minimum_frames' frames,
    and the target pitches on either end of the segment are the same,
    then the segment is adjusted to match the target pitches on either end.
    This helps to avoid one-frame jumps in the pitch due to vibrato.
    Setting 'minimum_frames' to 1 disables smoothing.
    """
    # Create list of all segments
    segments = []
    segment_pitch, segment_duration = pitches.fx[0], 1
    for i in range(1, len(pitches.fx)):
        if pitches.fx[i] == segment_pitch:
            segment_duration += 1
        else:
            segments.append([segment_pitch, segment_duration])
            segment_pitch, segment_duration = pitches.fx[i], 1
    segments.append([segment_pitch, segment_duration])

    def smooth_segments_with_length(l):
        i = 1
        while i < len(segments) - 1:
            if segments[i][1] != l:
                i += 1
            elif segments[i-1][0] == segments[i+1][0]:
                segments[i-1][1] += (segments[i][1] + segments[i+1][1])
                segments.pop(i+1)
                segments.pop(i)
            else:
                i += 1

    # Order of operations matters, so smooth the smallest segments first
    for l in range(1, minimum_frames):
        smooth_segments_with_length(l)
    
    new_pitches = []
    for segment in segments:
        new_pitches += [segment[0]] * segment[1]

    return LerpArray(new_pitches)

def balance_pitches(pitches, target_pitches, attack=0.0, strength=1.0):
    attack_frames = int(((attack * 10) / (1 - 0.8)) + 1)
    balance = np.zeros(len(target_pitches.fx))
    balance[0] = strength / attack_frames
    current_pitch, current_count = target_pitches.fx[0], 1
    for i in range(1, len(target_pitches.fx)):
        if target_pitches.fx[i] != current_pitch:
            current_pitch, current_count = target_pitches.fx[i], 1
        else:
            current_count += 1
        balance[i] = (strength * min(current_count, attack_frames)) / attack_frames

    # import matplotlib.pyplot as plt
    # plt.plot(balance)
    # plt.show()

    return LerpArray((pitches.fx * (1 - balance)) + (target_pitches.fx * balance))

def set_pitches(pitches, f):
    """
    Creates a new LerpArray of pitch measurements of the same length 
    as the input with all pitches set to f.
    """
    return LerpArray(np.ones(len(pitches)) * f)