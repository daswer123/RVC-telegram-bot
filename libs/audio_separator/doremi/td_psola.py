import numpy as np

from .util import Signal, Window


def td_psola(signal, analysis_markers, target_markers, target_voiced=None):
    """
    An implementation of the Time Domain Pitch Synchronous Overlap-Add algorithm,
    with additional modifications inspiried by Praat.
    """
    y_output = np.zeros(len(signal.y))

    for i in range(len(target_markers)):
        target_idx = target_markers.markers[i]
        closest_analysis_marker = np.argmin(np.abs(target_idx - analysis_markers.markers))

        if target_voiced is not None and not target_voiced[i]:
            # If this target marker is in an unvoiced (non-tonal) segment of the source signal,
            # use the corresponding segment of the source sound directly
            analysis_idx = target_idx
            analysis_f = target_markers.frequencies[i]
            period_left = target_idx - target_markers.markers[i - 1] if i > 0 else target_idx
            period_right = target_markers.markers[i + 1] - target_idx if i < len(target_markers.markers) - 1 else round(signal.sr / analysis_f)
        else:
            # Use a segment of the source sound from the nearest analysis marker
            analysis_idx = analysis_markers.markers[closest_analysis_marker]
            analysis_f = analysis_markers.frequencies[closest_analysis_marker]
            period_left = min(
                    analysis_idx - analysis_markers.markers[closest_analysis_marker - 1] if closest_analysis_marker > 0 else analysis_idx,
                    target_idx - target_markers.markers[i - 1] if i > 0 else target_idx
            )
            period_right = min(
                    analysis_markers.markers[closest_analysis_marker + 1] - analysis_idx if closest_analysis_marker < len(analysis_markers.markers) - 1 else round(signal.sr / analysis_f),
                    target_markers.markers[i + 1] - target_idx if i < len(target_markers.markers) - 1 else round(signal.sr / analysis_f)
            )

        t_s, t_e = analysis_idx - period_left, analysis_idx + period_right
        t_sa, t_ea = int(target_idx - period_left), int(target_idx + period_right)
        if t_s < 0 or t_sa < 0:
            continue
        if t_e >= len(signal.y) or t_ea > len(signal.y):
            break

        window = Window(signal.y[t_s:t_e], (period_left, period_right))
        y_output[t_sa:t_ea] += window.window

    return Signal(y_output, signal.sr)