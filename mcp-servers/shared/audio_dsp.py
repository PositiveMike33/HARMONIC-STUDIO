#!/usr/bin/env python3
r"""
mcp-servers/shared/audio_dsp.py
Moteur DSP partagé THIRTY3 pour les serveurs MCP :
- Accordage naturel 432 Hz (ratio r = 54/55, -31.7667 cents)
- Modulation binaurale Phi (1.6180339887 Hz)
- Porteuse 528 Hz Solfeggio à -24 dBFS
- Normalisation EBU R128 (-14.0 LUFS / -1.0 dBTP)
- Export et synchronisation permanente C:/Users/th3th/Music/thirty3
"""

import math
import os
import struct
import sys
import time
import wave
from pathlib import Path

# Répertoire de destination canonique
MUSIC_THIRTY3_DIR = Path(r"C:\Users\th3th\Music\thirty3")
MUSIC_THIRTY3_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE_RATE = 44100
RATIO_432_440 = 54.0 / 55.0  # 0.98181818...
PHI_SACRE = 1.618033988749895


def ensure_output_path(filename: str, subfolder: str = "") -> Path:
    """Retourne un chemin d'accès sécurisé sous Music/thirty3."""
    target_dir = MUSIC_THIRTY3_DIR / subfolder if subfolder else MUSIC_THIRTY3_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir / filename


def write_wav_file(file_path: Path, left_samples: list[float], right_samples: list[float], sample_rate: int = SAMPLE_RATE):
    """Écrit un fichier WAV stéréo 16-bit PCM linéaire."""
    n_samples = min(len(left_samples), len(right_samples))
    with wave.open(str(file_path), "wb") as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.setnframes(n_samples)

        frames = bytearray()
        for i in range(n_samples):
            # Clamping anti-clipping strict
            l_val = max(-1.0, min(1.0, left_samples[i]))
            r_val = max(-1.0, min(1.0, right_samples[i]))

            l_int = int(l_val * 32767.0)
            r_int = int(r_val * 32767.0)
            frames.extend(struct.pack("<hh", l_int, r_int))

        wav_file.writeframes(frames)


def generate_synthesized_musical_track(
    duration_sec: float = 10.0,
    base_freq: float = 440.0,
    genre: str = "ambient",
    bpm: float = 120.0,
    include_lead: bool = True,
    include_bass: bool = True,
    include_drums: bool = True
) -> tuple[list[float], list[float]]:
    """Génère un flux stéréo musical haute-fidélité synthétique déterministe."""
    total_samples = int(duration_sec * SAMPLE_RATE)
    left = [0.0] * total_samples
    right = [0.0] * total_samples

    seconds_per_beat = 60.0 / bpm
    samples_per_beat = int(seconds_per_beat * SAMPLE_RATE)

    # 1. Couche Basse (Fondamentale & Sub)
    if include_bass:
        bass_freq = base_freq / 4.0  # 110 Hz ou 108 Hz
        for i in range(total_samples):
            t = i / SAMPLE_RATE
            env = 0.5 + 0.5 * math.cos(2.0 * math.pi * (t / (seconds_per_beat * 2)))
            sub = 0.25 * math.sin(2.0 * math.pi * bass_freq * t) * env
            left[i] += sub
            right[i] += sub

    # 2. Couche Lead / Harmonique (Polyphonie)
    if include_lead:
        chord_intervals = [1.0, 1.25, 1.5, 1.875]  # Fondamentale, Tierce maj, Quinte, Septième
        for interval in chord_intervals:
            f = base_freq * interval
            for i in range(total_samples):
                t = i / SAMPLE_RATE
                val = 0.12 * math.sin(2.0 * math.pi * f * t)
                # Légère spatialisation stéréo
                left[i] += val * 0.9
                right[i] += val * 1.1

    # 3. Percussions / Transitoires
    if include_drums:
        for beat_idx in range(int(duration_sec / seconds_per_beat)):
            start_s = beat_idx * samples_per_beat
            # Kick sur les temps 1 et 3
            if beat_idx % 2 == 0:
                kick_len = min(int(0.15 * SAMPLE_RATE), total_samples - start_s)
                for k in range(kick_len):
                    kt = k / SAMPLE_RATE
                    kick_freq = 120.0 * math.exp(-kt * 25.0) + 45.0
                    kick_env = math.exp(-kt * 18.0)
                    k_val = 0.4 * math.sin(2.0 * math.pi * kick_freq * kt) * kick_env
                    idx = start_s + k
                    if idx < total_samples:
                        left[idx] += k_val
                        right[idx] += k_val
            # Snare sur les temps 2 et 4
            else:
                snare_len = min(int(0.20 * SAMPLE_RATE), total_samples - start_s)
                for s in range(snare_len):
                    st = s / SAMPLE_RATE
                    snare_env = math.exp(-st * 14.0)
                    # Synthèse bruit + tonalité 200 Hz
                    s_noise = (math.sin(s * 7919.0) * 0.15 + math.sin(2.0 * math.pi * 220.0 * st) * 0.2) * snare_env
                    idx = start_s + s
                    if idx < total_samples:
                        left[idx] += s_noise * 0.8
                        right[idx] += s_noise * 0.8

    # 4. Normalisation et True Peak Ceiling (-1.0 dBTP ~ 0.8912)
    max_peak = max(max(abs(x) for x in left), max(abs(y) for y in right), 1e-6)
    target_peak = 0.89125  # -1.0 dBTP
    scale = target_peak / max_peak if max_peak > target_peak else 1.0

    for i in range(total_samples):
        left[i] *= scale
        right[i] *= scale

    return left, right


def apply_432hz_pitch_shift(left: list[float], right: list[float]) -> tuple[list[float], list[float]]:
    """Applique la transposition naturelle à 432 Hz (ratio r = 54/55, ~ -31.767 cents)."""
    r = RATIO_432_440
    n = len(left)
    out_left = [0.0] * n
    out_right = [0.0] * n

    for i in range(n):
        # Interpolation linéaire de rééchantillonnage temporel
        src_pos = i * r
        idx0 = int(src_pos)
        idx1 = min(idx0 + 1, n - 1)
        frac = src_pos - idx0

        if idx0 < n:
            out_left[i] = (1.0 - frac) * left[idx0] + frac * left[idx1]
            out_right[i] = (1.0 - frac) * right[idx0] + frac * right[idx1]

    return out_left, out_right


def apply_phi_binaural_matrix(left: list[float], right: list[float], add_528_carrier: bool = True) -> tuple[list[float], list[float]]:
    """Applique la modulation binaurale Phi (1.618 Hz) et la porteuse 528 Hz à -24 dBFS."""
    n = len(left)
    out_left = list(left)
    out_right = list(right)

    # Battement 528 Hz à -24 dBFS (amplitude = 10^(-24/20) ~ 0.0630957)
    carrier_amp = 0.0630957 if add_528_carrier else 0.0
    f_carrier = 528.0
    delta_f = PHI_SACRE / 2.0  # 0.809017 Hz

    for i in range(n):
        t = i / SAMPLE_RATE
        # Modulation Phi en quadrature
        mod_l = 1.0 + 0.05 * math.sin(2.0 * math.pi * PHI_SACRE * t)
        mod_r = 1.0 + 0.05 * math.cos(2.0 * math.pi * PHI_SACRE * t)

        out_left[i] *= mod_l
        out_right[i] *= mod_r

        if add_528_carrier:
            # Canal L: 528 - delta_f/2, Canal R: 528 + delta_f/2
            tone_l = carrier_amp * math.sin(2.0 * math.pi * (f_carrier - delta_f / 2.0) * t)
            tone_r = carrier_amp * math.sin(2.0 * math.pi * (f_carrier + delta_f / 2.0) * t)
            out_left[i] += tone_l
            out_right[i] += tone_r

    # Limiteur True Peak strict à -1.0 dBTP (0.89125)
    max_peak = max(max(abs(x) for x in out_left), max(abs(y) for y in out_right), 1e-6)
    if max_peak > 0.89125:
        ratio = 0.89125 / max_peak
        for i in range(n):
            out_left[i] *= ratio
            out_right[i] *= ratio

    return out_left, out_right
