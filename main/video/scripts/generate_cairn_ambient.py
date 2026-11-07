from pathlib import Path
import math, wave
import numpy as np

FS = 48000
SECONDS = 60
CHUNK = FS * 3
OUT = Path('video/public/audio/cairn-ambient.wav')
OUT.parent.mkdir(parents=True, exist_ok=True)
# D major color: Dmaj9, Aadd9, Bm7, Gmaj9. Four gentle 80 BPM bars per chord.
CHORDS = [
    [73.42, 146.83, 185.00, 220.00, 277.18, 329.63, 440.00],
    [55.00, 110.00, 164.81, 220.00, 246.94, 329.63, 440.00],
    [61.74, 123.47, 146.83, 185.00, 220.00, 293.66, 369.99],
    [49.00, 98.00, 146.83, 196.00, 220.00, 293.66, 392.00],
]
CHORD_SECONDS = 12.0
BEAT_SECONDS = 0.75

def pad(t, chord):
    out = np.zeros_like(t)
    for i, freq in enumerate(chord):
        phase = (i * 0.83) % (2 * math.pi)
        amp = (0.010 if i < 4 else 0.0075) / (1 + i * 0.06)
        vibrato = np.sin(2 * math.pi * (0.11 + i * 0.009) * t + phase) * (0.12 if i > 1 else 0.035)
        l = np.sin(2 * math.pi * freq * (1 + vibrato * 0.00045) * t + phase)
        r = np.sin(2 * math.pi * freq * (1 - vibrato * 0.00045) * t + phase + 0.08)
        harmonic_l = np.sin(2 * math.pi * freq * 2.002 * t + phase) * 0.19
        harmonic_r = np.sin(2 * math.pi * freq * 1.998 * t + phase + 0.1) * 0.19
        out += ((l + harmonic_l) + (r + harmonic_r)) * amp * 0.5
    breath = 0.9 + 0.1 * np.sin(2 * math.pi * t / 13.5)
    return out * breath

with wave.open(str(OUT), 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(FS)
    for first in range(0, FS * SECONDS, CHUNK):
        count = min(CHUNK, FS * SECONDS - first)
        t = (np.arange(first, first + count, dtype=np.float64) / FS)
        chord_pos = np.mod(t, CHORD_SECONDS)
        chord_idx = np.floor(t / CHORD_SECONDS).astype(np.int32) % 4
        prev_idx = (chord_idx - 1) % 4
        blend = np.clip(chord_pos / 1.05, 0, 1)
        left = np.zeros(count, dtype=np.float64)
        right = np.zeros(count, dtype=np.float64)
        for c in range(4):
            active = chord_idx == c
            previous = prev_idx == c
            if np.any(active):
                p = pad(t[active], CHORDS[c])
                left[active] += p * blend[active]
                right[active] += p * blend[active]
            if np.any(previous):
                p = pad(t[previous], CHORDS[c])
                right[previous] += p * (1 - blend[previous])
                left[previous] += p * (1 - blend[previous])
        beat_phase = np.mod(t, BEAT_SECONDS) / BEAT_SECONDS
        beat_number = np.floor(t / BEAT_SECONDS).astype(np.int32)
        # Soft low pulse at each bar; no hard dance kick.
        kick_phase = np.mod(t, 3.0)
        kick_env = np.exp(-kick_phase * 8.5) * (kick_phase < 0.42)
        kick_freq = 49 + 34 * np.exp(-kick_phase * 22)
        kick = np.sin(2 * math.pi * kick_freq * kick_phase) * kick_env * 0.075
        left += kick
        right += kick * 0.96
        # A soft, rounded pluck every other beat adds gentle forward motion.
        pluck_env = np.exp(-beat_phase * 13) * (1 - np.exp(-beat_phase * 110))
        pluck_active = (beat_number % 2) == 0
        pluck_env *= pluck_active
        note_bank = np.array([220.0, 277.18, 329.63, 369.99, 440.0, 493.88])
        arp_idx = (beat_number // 2 + chord_idx) % len(note_bank)
        note_freq = note_bank[arp_idx]
        pluck = (np.sin(2 * math.pi * note_freq * t) + 0.22 * np.sin(2 * math.pi * note_freq * 2.01 * t)) * pluck_env * 0.028
        left += pluck
        right += np.sin(2 * math.pi * note_freq * 1.002 * t + 0.04) * pluck_env * 0.028
        # Smooth, short global head and tail so the bed enters and leaves cleanly.
        fade_in = np.clip(t / 1.2, 0, 1)
        fade_out = np.clip((SECONDS - t) / 2.0, 0, 1)
        envelope = np.minimum(fade_in, fade_out)
        left *= envelope
        right *= envelope
        stereo = np.stack([left, right], axis=1) * 3.5
        stereo = np.clip(stereo, -0.9, 0.9)
        wav.writeframes((stereo * 32767).astype('<i2').tobytes())
print(f'Wrote {OUT} ({SECONDS}s, {FS}Hz stereo)')
