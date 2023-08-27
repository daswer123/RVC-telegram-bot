import numpy as np

from .util import (
    Signal, 
    Frames, 
    PitchMarkers
)
from .tuners import (
    sweep_pitch_algorithm, 
    get_pitch_markers, 
    tune_pitches, 
    smooth_pitches,
    balance_pitches
)
from .td_psola import td_psola


def tune(filename, output_filename, key="C", scale="major", attack=0.0, strength=1.0, minimum_frames=4, debug=False):
    signal = Signal.from_file(filename)
    frames = Frames(round(signal.sr/10), 0.8)
    frames.frame_signal(signal)
    
    pitches, energies = sweep_pitch_algorithm(frames)
    energy_range = max(energies.fx) - min(energies.fx)
    energy_threshold = (energy_range * 0.1) + min(energies.fx)
    
    source_markers = get_pitch_markers(frames, pitches)
    source_voiced_idx = np.where(energies[frames.get_frame_index(source_markers.markers)] > energy_threshold)
    analysis_markers = PitchMarkers(source_markers.markers[source_voiced_idx], source_markers.frequencies[source_voiced_idx])
    
    target_pitches = tune_pitches(pitches, tonic=key, scale=scale)
    target_pitches_smooth = smooth_pitches(target_pitches, minimum_frames=minimum_frames)
    target_pitches_balanced = balance_pitches(pitches, target_pitches_smooth, attack=attack, strength=strength)
    target_markers = get_pitch_markers(frames, target_pitches_balanced)
    target_voiced = energies[frames.get_frame_index(target_markers.markers)] > energy_threshold
    
    signal_output = td_psola(signal, analysis_markers, target_markers, target_voiced)
    
    signal_output.save_to(output_filename)
