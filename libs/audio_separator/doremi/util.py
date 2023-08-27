import math
import numpy as np
import soundfile as sf


class Signal:
    """
    Data for a sound file.
    """
    def __init__(self, y, sr):
        self.y = y
        self.sr = sr
    
    def from_file(filename):
        y, sr = sf.read(filename)
        return Signal(y, sr)

    def save_to(self, filename):
        sf.write(filename, self.y, self.sr)

class LerpArray:
    """
    A linearly interpolatable array.
    """
    def __init__(self, array):
        self.fx = np.array(array)
        self.x = np.arange(len(self.fx))
    
    def __getitem__(self, index):
        return np.interp(index, self.x, self.fx)

    def __len__(self):
        return len(self.fx)

class Frames:
    """
    A structure to organize the individual windows of a framed signal.
    """
    def __init__(self, window_length, overlap):
        self.window_length = window_length
        self.hop_length = math.ceil(window_length * (1 - overlap))
        self.hanning = hann(self.window_length)

        self.signal = None
        self.sr = None
        self.frames = None
        self.centers = None

    def frame_signal(self, signal):
        starts = np.arange(0, len(signal.y) - self.window_length + 1, self.hop_length)
        slices = np.array([signal.y[i:i+self.window_length] for i in starts])
        norms = slices - np.expand_dims(np.mean(slices, axis=1), axis=1)

        self.signal = signal.y
        self.sr = signal.sr
        self.frames = norms * self.hanning
        self.centers = (self.window_length // 2) + (np.arange(len(starts)) * self.hop_length)

    def get_frame_index(self, sample_idx):
        return np.clip(
            (sample_idx - (self.window_length // 2)) / self.hop_length, 
            0, 
            len(self.frames) - 1
        )

    def get_closest_frame_index(self, sample_idx):
        return round(self.get_frame_index(sample_idx))

    def __len__(self):
        if self.frames is None:
            return 0
        return len(self.frames)

def hann(n):
    """
    A gross, unreadable recreation of scipy.signal.hann(M).
    """
    return 0.5*np.cos(2*np.pi*((np.arange(n)/(n-1))-0.5))+0.5

class Window:
    """
    A helper class for TD-PSOLA. 
    Makes it easier to construct unbalanced Hanning windows from a signal.
    """
    def __init__(self, y, periods=None):
        if periods is None:
            self.weights = hann(len(y))
            self.window = self.weights * y
        else:
            period_left, period_right = periods
            self.weights = np.zeros(period_left + period_right)
            self.weights[:period_left] = hann(2 * period_left)[:period_left]
            self.weights[-period_right:] = hann(2 * period_right)[-period_right:]
            self.window = self.weights * y

class PitchMarkers:
    """
    A series of indices of pitch-synchronous markers in a signal.
    """
    def __init__(self, markers, markers_f):
        self.markers = np.array(markers)
        self.frequencies = np.array(markers_f)

    def __len__(self):
        return len(self.markers)