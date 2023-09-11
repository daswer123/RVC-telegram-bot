export function noteOctaveToFrequency(note, octave) {
    var noteMap = {
        'C': -9,
        'C#': -8,
        'Db': -8,
        'D': -7,
        'D#': -6,
        'Eb': -6,
        'E': -5,
        'F': -4,
        'F#': -3,
        'Gb': -3,
        'G': -2,
        'G#': -1,
        'Ab': -1,
        'A': 0,
        'A#': 1,
        'Bb': 1,
        'B': 2
    };

    var noteNumber = noteMap[note.toUpperCase()] + (octave - 4) * 12;
    var a4Freq = 440;
    var frequency = a4Freq * Math.pow(2, noteNumber / 12);

    // Ограничиваем диапазон частоты от 1 до 16000 Гц
    if (frequency < 1) {
        return 1;
    } else if (frequency > 16000) {
        return 16000;
    } else {
        return frequency;
    }
}