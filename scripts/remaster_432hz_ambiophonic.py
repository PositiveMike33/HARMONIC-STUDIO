#!/usr/bin/env python3
"""
remaster_432hz_ambiophonic.py
=============================
THIRTY3 Autonomous Audio Skill: youtube-remaster-mp3-432hz-ambiophonic

Pipeline:
1. Ingest YouTube stream in optimal quality via yt-dlp
2. Natural Verdi tuning transposition (440 Hz -> 432 Hz, ratio 54/55, -31.7666 cents)
3. High-definition SOXR 96 kHz resampling
4. Surgical Guitar Anti-Fizz & Vocal Clarity EQ (1.8 kHz, 4.2 kHz notch, 7.5 kHz, 12 kHz)
5. 3D Ambiophonic Holographique stereophonic field expansion (stereotools mlev=0.96:slev=1.22)
6. Two-pass EBU R128 loudness normalization (-14.0 LUFS / -1.0 dBTP)
7. Square thumbnail extraction and APIC ID3v2 tag injection
8. Multi-destination synchronization into C:\\Users\\th3th\\Music\\thirty3\\432 hz ambiophonique\\
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PERMANENT_DIR = Path(r"C:\Users\th3th\Music\thirty3")
DEFAULT_AMBIOPHONIC_DIR = PERMANENT_DIR / "432 hz ambiophonique"

RATIO_432 = "0.98181818"  # 54/55 = 432 / 440 (-31.7666 cents)

# Surgical DSP Ambiophonic chain
DSP_CHAIN_432_AMBIOPHONIC = (
    f"rubberband=pitch={RATIO_432}:transients=smooth:detector=soft,"
    "aresample=96000:resampler=soxr:precision=33:osf=fltp,"
    "equalizer=f=1800:t=q:w=1.4:g=1.2,"
    "equalizer=f=4200:t=q:w=2.2:g=-2.5,"
    "equalizer=f=7500:t=q:w=1.8:g=-2.0,"
    "equalizer=f=12000:t=s:width=1.0:g=-1.0,"
    "stereotools=mlev=0.96:slev=1.22:balance_in=0:softclip=1"
)


def clean_filename(name: str) -> str:
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def run_command(cmd: list[str], desc: str) -> subprocess.CompletedProcess:
    print(f"[*] {desc}...")
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        print(f"[!] Erreur ({desc}):\n{res.stderr}", file=sys.stderr)
        sys.exit(1)
    return res


def extract_metadata_and_audio(url: str, temp_dir: Path, cookies: str | None = None) -> tuple[Path, Path | None, str, str]:
    print(f"[*] Téléchargement YouTube : {url}")
    json_cmd = [
        "yt-dlp",
        "--dump-json",
        "--no-playlist",
        url
    ]
    if cookies and os.path.exists(cookies):
        json_cmd.extend(["--cookies", cookies])

    res = run_command(json_cmd, "Extraction des métadonnées YouTube")
    info = json.loads(res.stdout)
    title = clean_filename(info.get("title", "Unknown Title"))
    artist = clean_filename(info.get("uploader", info.get("channel", "THIRTY3")))

    raw_audio = temp_dir / "raw_audio.wav"
    raw_thumb = temp_dir / "thumbnail.jpg"

    dl_cmd = [
        "yt-dlp",
        "--extract-audio",
        "--audio-format", "wav",
        "--write-thumbnail",
        "--convert-thumbnails", "jpg",
        "--output", str(temp_dir / "source.%(ext)s"),
        "--no-playlist",
        url
    ]
    if cookies and os.path.exists(cookies):
        dl_cmd.extend(["--cookies", cookies])

    run_command(dl_cmd, "Téléchargement de l'audio haute fidélité")

    for p in temp_dir.glob("source*.wav"):
        p.rename(raw_audio)
        break

    if not raw_audio.exists():
        for p in temp_dir.glob("source*"):
            if p.suffix.lower() in [".opus", ".m4a", ".webm", ".mp3", ".flac"]:
                conv_cmd = ["ffmpeg", "-y", "-i", str(p), "-vn", "-ar", "48000", "-ac", "2", str(raw_audio)]
                run_command(conv_cmd, f"Conversion de {p.name} en WAV")
                break

    if not raw_audio.exists():
        print("[!] Erreur critique : Impossible de récupérer le flux audio source.", file=sys.stderr)
        sys.exit(1)

    thumb_found = None
    for p in temp_dir.glob("source*.jpg"):
        thumb_found = p
        break

    square_thumb = None
    if thumb_found and thumb_found.exists():
        square_thumb = raw_thumb
        crop_cmd = [
            "ffmpeg", "-y", "-i", str(thumb_found),
            "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
            "-q:v", "2",
            str(square_thumb)
        ]
        res_thumb = subprocess.run(crop_cmd, capture_output=True)
        if res_thumb.returncode != 0:
            square_thumb = thumb_found

    return raw_audio, square_thumb, title, artist


def process_ambiophonic_audio(raw_audio: Path, temp_dir: Path, target_lufs: float = -14.0, true_peak: float = -1.0) -> Path:
    pitched_audio = temp_dir / "ambiophonic_dsp.wav"

    dsp_cmd = [
        "ffmpeg", "-y",
        "-i", str(raw_audio),
        "-af", DSP_CHAIN_432_AMBIOPHONIC,
        "-ar", "48000",
        "-ac", "2",
        str(pitched_audio)
    ]
    run_command(dsp_cmd, "Traitement DSP 432 Hz Ambiophonique & Égalisation Anti-Fizz")

    # Pass 1: Mesure loudnorm
    measure_cmd = [
        "ffmpeg", "-y",
        "-i", str(pitched_audio),
        "-af", f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:print_format=json",
        "-f", "null", "-"
    ]
    print("[*] EBU R128 Passe 1 : Mesure des paramètres de sonie...")
    res_m = subprocess.run(measure_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    
    measured_i = f"{target_lufs}"
    measured_tp = f"{true_peak}"
    measured_lra = "11.0"
    measured_thresh = "-24.0"
    offset = "0.0"

    try:
        json_str = res_m.stderr[res_m.stderr.rfind("{"):res_m.stderr.rfind("}") + 1]
        m_data = json.loads(json_str)
        measured_i = m_data.get("input_i", measured_i)
        measured_tp = m_data.get("input_tp", measured_tp)
        measured_lra = m_data.get("input_lra", measured_lra)
        measured_thresh = m_data.get("input_thresh", measured_thresh)
        offset = m_data.get("target_offset", offset)
    except Exception:
        print("[*] Détection JSON partielle, utilisation des bornes par défaut conformes EBU R128.")

    # Pass 2: Application loudnorm
    normalized_audio = temp_dir / "normalized_audio.wav"
    loudnorm_filter = (
        f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:"
        f"measured_I={measured_i}:measured_TP={measured_tp}:"
        f"measured_LRA={measured_lra}:measured_thresh={measured_thresh}:"
        f"offset={offset}:linear=true"
    )
    apply_cmd = [
        "ffmpeg", "-y",
        "-i", str(pitched_audio),
        "-af", loudnorm_filter,
        "-ar", "48000",
        "-ac", "2",
        str(normalized_audio)
    ]
    run_command(apply_cmd, "EBU R128 Passe 2 : Normalisation EBU R128 & Plafond True Peak")

    return normalized_audio


def assemble_final_mp3(normalized_audio: Path, square_thumb: Path | None, title: str, artist: str, output_path: Path):
    cmd = ["ffmpeg", "-y", "-i", str(normalized_audio)]
    if square_thumb and square_thumb.exists():
        cmd.extend(["-i", str(square_thumb), "-map", "0:a", "-map", "1:v", "-c:v", "copy", "-id3v2_version", "3"])
    else:
        cmd.extend(["-id3v2_version", "3"])

    cmd.extend([
        "-c:a", "libmp3lame",
        "-b:a", "320k",
        "-metadata", f"title={title}",
        "-metadata", f"artist={artist}",
        "-metadata", "album=THIRTY3 432Hz Ambiophonique",
        "-metadata", "comment=THIRTY3 432Hz Verdi Tuning + Ambiophonic 3D Holographic + EBU R128 Mastered",
        str(output_path)
    ])
    run_command(cmd, "Encodage MP3 320 kbps avec tags ID3v2 et pochette intégrée")


def sync_to_library(output_path: Path, artist: str) -> list[Path]:
    destinations = []
    clean_artist = clean_filename(artist)

    # 1. 432 hz ambiophonique root
    DEFAULT_AMBIOPHONIC_DIR.mkdir(parents=True, exist_ok=True)
    d1 = DEFAULT_AMBIOPHONIC_DIR / output_path.name
    if d1 != output_path:
        shutil.copy2(output_path, d1)
    destinations.append(d1)

    # 2. 432 hz ambiophonique / artist
    d2_dir = DEFAULT_AMBIOPHONIC_DIR / clean_artist
    d2_dir.mkdir(parents=True, exist_ok=True)
    d2 = d2_dir / output_path.name
    shutil.copy2(output_path, d2)
    destinations.append(d2)

    # 3. root library thirty3
    PERMANENT_DIR.mkdir(parents=True, exist_ok=True)
    d3 = PERMANENT_DIR / output_path.name
    shutil.copy2(output_path, d3)
    destinations.append(d3)

    # 4. root library thirty3 / artist
    d4_dir = PERMANENT_DIR / clean_artist
    d4_dir.mkdir(parents=True, exist_ok=True)
    d4 = d4_dir / output_path.name
    shutil.copy2(output_path, d4)
    destinations.append(d4)

    return destinations


def main():
    parser = argparse.ArgumentParser(
        description="Remasterisation YouTube en MP3 320 kbps 432 Hz Ambiophonique Holographique 3D"
    )
    parser.add_argument("--url", required=True, help="URL de la vidéo YouTube")
    parser.add_argument("--target-lufs", type=float, default=-14.0, help="Cible LUFS (défaut: -14.0)")
    parser.add_argument("--true-peak", type=float, default=-1.0, help="Plafond True Peak (défaut: -1.0 dBTP)")
    parser.add_argument("--output-dir", type=str, default=str(DEFAULT_AMBIOPHONIC_DIR), help="Dossier de sortie")
    parser.add_argument("--cookies", type=str, default=None, help="Chemin vers le fichier de cookies")
    parser.add_argument("--keep-temp", action="store_true", help="Conserver les fichiers temporaires")

    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        raw_audio, square_thumb, title, artist = extract_metadata_and_audio(
            args.url, temp_dir, cookies=args.cookies
        )
        print(f"[*] Titre : {title}")
        print(f"[*] Artiste : {artist}")

        normalized_audio = process_ambiophonic_audio(
            raw_audio, temp_dir, target_lufs=args.target_lufs, true_peak=args.true_peak
        )

        out_name = f"{artist} - {title}_432Hz_Ambiophonique.mp3"
        final_mp3 = out_dir / out_name

        assemble_final_mp3(normalized_audio, square_thumb, title, artist, final_mp3)

        print(f"[+] Master 432 Hz Ambiophonique généré : {final_mp3}")
        print(f"    Taille : {final_mp3.stat().st_size / (1024 * 1024):.2f} Mo")

        synced = sync_to_library(final_mp3, artist)
        print(f"[+] Synchronisation réussie sur {len(synced)} emplacements permanents :")
        for p in synced:
            print(f"    -> {p}")


if __name__ == "__main__":
    main()
