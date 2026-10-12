#!/usr/bin/env python3
"""
reaccorde_normandie_orchestral.py
=================================
Ré-accordage souverain & Transmutation Haute Fidélité pour NORMANDIE :
Source : Flux officiels studio 440 Hz natifs (YouTube)
DSP Chain : 432 Hz Verdi (54/55, -31.7666 cents), SOXR 96 kHz, EQ 6 bandes anti-masquage,
           crystalizer i=1.4, 3D Ambiophonique Orchestral (M=0.98, S=1.28),
           2-pass EBU R128 (-14 LUFS, -1.0 dBTP), MP3 320 kbps, artwork carré et tags ID3v2.3.
Cible : C:\\Users\\th3th\\Music\\thirty3\\432 hz ambiophonique orchestral\\NORMANDIE\\
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

TARGET_DIR = Path(r"C:\Users\th3th\Music\thirty3\432 hz ambiophonique orchestral\NORMANDIE")
TARGET_DIR.mkdir(parents=True, exist_ok=True)

RATIO_432 = "0.98181818"  # 54/55 = 432 / 440 (-31.7666 cents)

DSP_CHAIN_ORCHESTRAL_432 = (
    "volume=-2.0dB,highpass=f=30,"
    f"rubberband=pitch={RATIO_432}:transients=smooth:detector=soft,"
    "aresample=96000:resampler=soxr:precision=33:osf=fltp,"
    "equalizer=f=220:t=q:w=1.5:g=1.2,"      # Assise et corps fondamental
    "equalizer=f=1100:t=q:w=2.2:g=-2.2,"    # Encoche anti-cacanne (suppression boîte)
    "equalizer=f=2800:t=q:w=2.0:g=1.8,"     # Clarté formantique diction au premier plan
    "equalizer=f=4200:t=q:w=2.5:g=-2.8,"    # Encoche anti-fizz guitares / saturation
    "equalizer=f=5500:t=q:w=2.5:g=2.2,"     # Éclat harmonique et aération
    "equalizer=f=7500:t=q:w=2.0:g=-2.0,"    # Anti-stridence cymbales et cuivres
    "crystalizer=i=1.4:c=1,"                 # Affinement dynamique des transitoires
    "stereotools=mlev=0.98:slev=1.28:balance_in=0:softclip=1"  # 3D Ambiophonique Orchestral
)

NORMANDIE_TRACKS = [
    {
        "title": "(Don't) Need You",
        "video_id": "-C2E_ZXQYlA",
        "filename": "Normandie - (Don't) Need You_432Hz_Ambiophonique_Orchestral.mp3",
    },
    {
        "title": "All In My Head",
        "video_id": "mumHc9hwQpA",
        "filename": "Normandie - All In My Head_432Hz_Ambiophonique_Orchestral.mp3",
    },
    {
        "title": "Awakening",
        "video_id": "meslA7m3BOU",
        "filename": "Normandie - Awakening_432Hz_Ambiophonique_Orchestral.mp3",
    },
    {
        "title": "Babylon",
        "video_id": "2wI5Qc6Wxxs",
        "filename": "Normandie - Babylon_432Hz_Ambiophonique_Orchestral.mp3",
    },
    {
        "title": "Believe",
        "video_id": "8Ml46sinnb0",
        "filename": "Normandie - Believe_432Hz_Ambiophonique_Orchestral.mp3",
    },
    {
        "title": "Flowers For The Grave",
        "video_id": "JbBLJJupdZM",
        "filename": "Normandie - Flowers For The Grave_432Hz_Ambiophonique_Orchestral.mp3",
    },
    {
        "title": "Holy Water",
        "video_id": "hCqN8jrKtxk",
        "filename": "Normandie - Holy Water_432Hz_Ambiophonique_Orchestral.mp3",
    },
    {
        "title": "Hostage",
        "video_id": "AfezqkMiDYw",
        "filename": "Normandie - Hostage_432Hz_Ambiophonique_Orchestral.mp3",
    },
    {
        "title": "Serotonin",
        "video_id": "bHEHnzBKWjU",
        "filename": "Normandie - Serotonin_432Hz_Ambiophonique_Orchestral.mp3",
    },
]


def run_command(cmd: list[str], desc: str) -> subprocess.CompletedProcess:
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        print(f"  [!] Erreur ({desc}):\n{res.stderr[-300:]}", file=sys.stderr)
        raise RuntimeError(f"Command failed: {desc}")
    return res


def extract_audio_and_art(url: str, temp_dir: Path) -> tuple[Path, Path | None]:
    common_args = [
        "--extractor-args", "youtube:player_client=ios,android,web",
        "--js-runtimes", "node",
        "--no-warnings",
    ]
    raw_audio = temp_dir / "raw_audio.wav"
    dl_cmd = [
        "yt-dlp",
        "-x",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "-o", str(temp_dir / "download.%(ext)s"),
    ] + common_args + [url]
    run_command(dl_cmd, "Téléchargement audio brut")

    downloaded = list(temp_dir.glob("download.*"))
    if not downloaded:
        raise RuntimeError("Aucun flux audio téléchargé.")
    shutil.move(downloaded[0], raw_audio)

    # Miniature carrée
    thumb_path = None
    thumb_cmd = [
        "yt-dlp",
        "--write-thumbnail",
        "--skip-download",
        "--convert-thumbnails", "jpg",
        "-o", str(temp_dir / "thumb"),
    ] + common_args + [url]
    subprocess.run(thumb_cmd, capture_output=True)
    thumbs = list(temp_dir.glob("thumb*.jpg"))
    if thumbs:
        thumb_raw = thumbs[0]
        thumb_square = temp_dir / "thumb_square.jpg"
        crop_cmd = [
            "ffmpeg", "-y", "-i", str(thumb_raw),
            "-vf", "crop=w='min(iw,ih)':h='min(iw,ih)',scale=1000:1000:flags=lanczos",
            "-q:v", "2",
            str(thumb_square),
        ]
        if subprocess.run(crop_cmd, capture_output=True).returncode == 0:
            thumb_path = thumb_square
        else:
            thumb_path = thumb_raw

    return raw_audio, thumb_path


def measure_loudness(audio_path: Path) -> dict:
    filter_desc = f"{DSP_CHAIN_ORCHESTRAL_432},loudnorm=I=-14.0:TP=-1.0:LRA=11:print_format=json"
    cmd = [
        "ffmpeg", "-y", "-i", str(audio_path),
        "-af", filter_desc,
        "-f", "null", "-",
    ]
    res = run_command(cmd, "Passe 1 : Mesure EBU R128")
    lines = res.stderr.splitlines()
    json_lines = []
    recording = False
    for line in lines:
        if "{" in line:
            recording = True
        if recording:
            json_lines.append(line)
        if "}" in line and recording:
            break
    try:
        return json.loads("\n".join(json_lines))
    except Exception:
        return {
            "input_i": "-14.0", "input_tp": "-1.0", "input_lra": "11.0",
            "input_thresh": "-24.0", "target_offset": "0.0"
        }


def render_track(
    raw_audio: Path,
    thumb_path: Path | None,
    output_path: Path,
    title: str,
    artist: str,
    album: str,
    measured: dict,
):
    loudnorm_p2 = (
        f"loudnorm=I=-14.0:TP=-1.0:LRA=11:"
        f"measured_I={measured.get('input_i', '-14.0')}:"
        f"measured_TP={measured.get('input_tp', '-1.0')}:"
        f"measured_LRA={measured.get('input_lra', '11.0')}:"
        f"measured_thresh={measured.get('input_thresh', '-24.0')}:"
        f"offset={measured.get('target_offset', '0.0')}:linear=true"
    )
    final_af = f"{DSP_CHAIN_ORCHESTRAL_432},{loudnorm_p2}"

    cmd = ["ffmpeg", "-y", "-i", str(raw_audio)]
    if thumb_path and thumb_path.exists():
        cmd.extend(["-i", str(thumb_path)])

    cmd.extend(["-af", final_af, "-c:a", "libmp3lame", "-b:a", "320k"])

    if thumb_path and thumb_path.exists():
        cmd.extend([
            "-map", "0:a", "-map", "1:v",
            "-c:v", "copy",
            "-id3v2_version", "3",
            "-metadata:s:v", 'title="Album cover"',
            "-metadata:s:v", 'comment="Cover (front)"',
        ])
    else:
        cmd.extend(["-id3v2_version", "3"])

    output_title = f"{title} (432Hz Ambiophonique Orchestral)"
    cmd.extend([
        "-metadata", f"title={output_title}",
        "-metadata", f"artist={artist}",
        "-metadata", f"album={album}",
        "-metadata", "genre=Symphonic Ambiophonic 432Hz",
        "-metadata", "comment=Remastérisé en 432 Hz Ambiophonique Orchestral (Verdi 54/55, M/S 3D, EBU R128)",
        str(output_path),
    ])
    run_command(cmd, "Passe 2 : Rendu MP3 320 kbps")


def clean_old_files():
    # Nettoie les fichiers avec anciens noms à rallonge dans NORMANDIE
    for f in TARGET_DIR.glob("*.mp3"):
        fname = f.name
        if "Official Video" in fname or "Official Audio Stream" in fname or "Official Music Video" in fname:
            try:
                f.unlink()
                print(f"  [Purge ancien nom] {fname}")
            except Exception as e:
                print(f"  [!] Erreur purge {fname}: {e}")


def main():
    print("=" * 70)
    print("  RÉ-ACCORDAGE SOUVERAIN NORMANDIE : 432 HZ AMBIOPHONIQUE ORCHESTRAL")
    print("=" * 70)

    clean_old_files()

    success_count = 0
    total = len(NORMANDIE_TRACKS)

    for idx, item in enumerate(NORMANDIE_TRACKS, start=1):
        title = item["title"]
        vid = item["video_id"]
        filename = item["filename"]
        target_file = TARGET_DIR / filename
        url = f"https://www.youtube.com/watch?v={vid}"

        print(f"\n[{idx}/{total}] >>> {title} (ID: {vid})")
        t0 = time.time()

        try:
            with tempfile.TemporaryDirectory() as tmp_str:
                tmp_dir = Path(tmp_str)
                raw_audio, thumb_path = extract_audio_and_art(url, tmp_dir)
                measured = measure_loudness(raw_audio)

                local_mp3 = tmp_dir / filename
                render_track(
                    raw_audio=raw_audio,
                    thumb_path=thumb_path,
                    output_path=local_mp3,
                    title=title,
                    artist="Normandie",
                    album="432 Hz Ambiophonique Orchestral Studio",
                    measured=measured,
                )

                shutil.copy2(local_mp3, target_file)
                elapsed = time.time() - t0
                size_mb = target_file.stat().st_size / (1024 * 1024)
                print(f"  ✔ [TERMINÉ en {elapsed:.1f}s] {target_file.name} ({size_mb:.2f} Mo)")
                success_count += 1
        except Exception as e:
            print(f"  ✖ [ÉCHEC] {title}: {e}", file=sys.stderr)

    print("\n" + "=" * 70)
    print(f"  RÉ-ACCORDAGE TERMINÉ : {success_count}/{total} SUCCÈS")
    print("=" * 70)


if __name__ == "__main__":
    main()
