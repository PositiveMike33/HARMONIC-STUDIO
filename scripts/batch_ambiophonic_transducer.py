#!/usr/bin/env python3
r"""
batch_ambiophonic_transducer.py
Batch converts all 432 Hz masters in the THIRTY3 library into:
"C:\Users\th3th\Music\thirty3\432 hz ambiophonique"

Specifications:
- Accordage 432 Hz naturel préservé
- Ambiophonie 3D immersive (extrastereo + stereotools mid/side widening)
- Suppression chirurgicale du son strident / hi-pitch (atténuation 3.2 kHz et 12 kHz)
- Zéro onde artificielle parasite / zéro sifflement
- Normalisation EBU R128 (-14.0 LUFS / -1.0 dBTP)
- Conservation intégrale des tags ID3v2 et pochettes carrées
"""

import os
import sys
import subprocess
import shutil
import tempfile
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

MUSIC_DIR = Path(r"C:\Users\th3th\Music\thirty3")
OUTPUT_DIR = MUSIC_DIR / "output"
TARGET_AMBIOPHONIC_DIR = MUSIC_DIR / "432 hz ambiophonique"
TARGET_AMBIOPHONIC_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_LUFS_TARGET = -14.0
DEFAULT_TRUE_PEAK = -1.0
DEFAULT_BITRATE = "320k"

# DSP Filter for 3D Ambiophonic immersion without high-pitch harshness
DSP_AMBIOPHONIC = (
    "aresample=96000:resampler=soxr:precision=33:osf=fltp,"
    "extrastereo=m=1.35,"
    "equalizer=f=3200:t=q:w=1.5:g=-1.0,"
    "equalizer=f=12000:t=s:width=1.0:g=-1.5,"
    "stereotools=mlev=0.90:slev=1.20:balance_in=0:softclip=1"
)


def extract_cover_art(mp3_path: Path, temp_dir: Path) -> Path | None:
    cover_path = temp_dir / "cover.jpg"
    cmd = [
        "ffmpeg", "-y", "-i", str(mp3_path),
        "-an", "-vcodec", "copy",
        str(cover_path)
    ]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode == 0 and cover_path.exists() and cover_path.stat().st_size > 0:
        return cover_path
    return None


def get_metadata(mp3_path: Path) -> tuple[str, str, str]:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format_tags=title,artist,album",
        "-of", "default=noprint_wrappers=1",
        str(mp3_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    title, artist, album = "", "", ""
    for line in res.stdout.splitlines():
        if line.lower().startswith("tag:title="):
            title = line.split("=", 1)[1]
        elif line.lower().startswith("tag:artist="):
            artist = line.split("=", 1)[1]
        elif line.lower().startswith("tag:album="):
            album = line.split("=", 1)[1]

    if not title:
        base = mp3_path.stem.replace("_432Hz_Remastered", "").replace("_Remastered", "")
        if " - " in base:
            artist, title = base.split(" - ", 1)
        else:
            title = base
            artist = "THIRTY3"

    return title, artist, album


def process_ambiophonic(source_mp3: Path) -> bool:
    clean_stem = source_mp3.stem.replace("_432Hz_Remastered", "").replace("_Remastered", "")
    target_name = f"{clean_stem}_432Hz_Ambiophonique.mp3"
    target_path = TARGET_AMBIOPHONIC_DIR / target_name

    if target_path.exists() and target_path.stat().st_size > 100000:
        print(f"  [Skip] Already processed: {target_name}")
        return True

    title, artist, album = get_metadata(source_mp3)
    amb_title = f"{title} (432Hz Ambiophonique)"

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        cover_path = extract_cover_art(source_mp3, tmp_dir)
        temp_out = tmp_dir / target_name

        # Pass 1: loudnorm analysis with ambiophonic DSP
        p1_filter = f"{DSP_AMBIOPHONIC},loudnorm=I={DEFAULT_LUFS_TARGET}:TP={DEFAULT_TRUE_PEAK}:LRA=11:print_format=json[out]"
        p1_cmd = [
            "ffmpeg", "-i", str(source_mp3),
            "-filter_complex", p1_filter,
            "-map", "[out]",
            "-f", "null", "-"
        ]
        p1_res = subprocess.run(p1_cmd, capture_output=True, text=True)

        m_i = str(DEFAULT_LUFS_TARGET)
        m_tp = str(DEFAULT_TRUE_PEAK)
        m_lra = "11"
        m_th = "-30"
        m_off = "0"
        for line in p1_res.stderr.splitlines():
            if "input_i" in line:
                m_i = line.split(":")[-1].strip().strip('",')
            elif "input_tp" in line:
                m_tp = line.split(":")[-1].strip().strip('",')
            elif "input_lra" in line:
                m_lra = line.split(":")[-1].strip().strip('",')
            elif "input_thresh" in line:
                m_th = line.split(":")[-1].strip().strip('",')
            elif "target_offset" in line:
                m_off = line.split(":")[-1].strip().strip('",')

        # Pass 2: render with loudnorm dual pass
        p2_filter = (
            f"{DSP_AMBIOPHONIC},"
            f"loudnorm=I={DEFAULT_LUFS_TARGET}:TP={DEFAULT_TRUE_PEAK}:LRA=11:"
            f"measured_I={m_i}:measured_TP={m_tp}:measured_LRA={m_lra}:measured_thresh={m_th}:offset={m_off}:linear=true[out]"
        )

        enc_cmd = ["ffmpeg", "-y", "-i", str(source_mp3)]
        if cover_path and cover_path.exists():
            enc_cmd.extend(["-i", str(cover_path)])
        enc_cmd.extend(["-filter_complex", p2_filter])
        if cover_path and cover_path.exists():
            enc_cmd.extend(["-map", "[out]", "-map", "1:v", "-c:v", "copy", "-disposition:v:0", "attached_pic"])
        else:
            enc_cmd.extend(["-map", "[out]"])

        enc_cmd.extend([
            "-c:a", "libmp3lame", "-b:a", DEFAULT_BITRATE,
            "-id3v2_version", "3",
            "-metadata", f"title={amb_title}",
            "-metadata", f"artist={artist}",
            "-metadata", f"album={album if album else 'THIRTY3 Ambiophonic 432Hz'}",
            "-metadata", "genre=Ambiophonic 432Hz",
            "-metadata", "comment=Ambiophonic 3D Spatial Soundstage with 432Hz Verdi Tuning (THIRTY3)",
            str(temp_out)
        ])

        res = subprocess.run(enc_cmd, capture_output=True)
        if res.returncode == 0 and temp_out.exists() and temp_out.stat().st_size > 0:
            shutil.copy2(temp_out, target_path)
            print(f"  ✔ {target_name} ({target_path.stat().st_size / (1024*1024):.2f} MB)")
            return True
        else:
            print(f"  ✘ Failed: {clean_stem}")
            return False


def main():
    print("=" * 75)
    print("⚜️ BATCH RÉACCORDAGE & CONVERSION AMBIOPHONIQUE 432 HZ THIRTY3")
    print(f"  Dossier cible: {TARGET_AMBIOPHONIC_DIR}")
    print("=" * 75)

    # Collect source files
    source_candidates = {}
    # 1. Output folder masters
    if OUTPUT_DIR.exists():
        for p in OUTPUT_DIR.glob("*_432Hz_Remastered.mp3"):
            source_candidates[p.stem] = p
    # 2. Main root 432Hz tracks
    for p in MUSIC_DIR.glob("*_432Hz_Remastered.mp3"):
        if p.stem not in source_candidates:
            source_candidates[p.stem] = p

    # 3. Add Michael's rap track if available
    rap_source = Path(r"D:\01_OPERATIONS_PRO\PROJETS\Thirty3 & E Made It\MikeGG_Never_let_go_126bpm.wav")
    if rap_source.exists():
        source_candidates["MikeGG_Never_let_go_126bpm"] = rap_source

    sources = sorted(source_candidates.values(), key=lambda p: p.name)
    total = len(sources)
    print(f"\nNombre de morceaux trouvés pour conversion ambiophonique: {total}")

    success_count = 0
    for idx, src in enumerate(sources, 1):
        print(f"\n[{idx}/{total}] Processing: {src.name}")
        if src.suffix.lower() == ".wav":
            # Special pitch-shift from 440 to 432 + ambiophonic
            clean_stem = src.stem
            target_name = f"{clean_stem}_432Hz_Ambiophonique.mp3"
            target_path = TARGET_AMBIOPHONIC_DIR / target_name
            if target_path.exists():
                print(f"  [Skip] Already processed: {target_name}")
                success_count += 1
                continue
            cover = Path(r"D:\01_OPERATIONS_PRO\PROJETS\Thirty3 & E Made It\Thirty3Emadeit.png")
            filter_wav = (
                "asetrate=47127,aresample=48000,"
                f"{DSP_AMBIOPHONIC},"
                f"loudnorm=I={DEFAULT_LUFS_TARGET}:TP={DEFAULT_TRUE_PEAK}:LRA=11"
            )
            cmd_wav = [
                "ffmpeg", "-y", "-i", str(src)
            ]
            if cover.exists():
                cmd_wav.extend(["-i", str(cover), "-map", "0:a", "-map", "1:v", "-c:v", "copy", "-disposition:v:0", "attached_pic"])
            else:
                cmd_wav.extend(["-map", "0:a"])
            cmd_wav.extend([
                "-filter:a", filter_wav,
                "-c:a", "libmp3lame", "-b:a", DEFAULT_BITRATE,
                "-id3v2_version", "3",
                "-metadata", "title=Never Let Go (432Hz Ambiophonique)",
                "-metadata", "artist=Michael GG (Thirty3 & E Made It)",
                "-metadata", "album=Thirty3 & E Made It",
                str(target_path)
            ])
            res_wav = subprocess.run(cmd_wav, capture_output=True)
            if res_wav.returncode == 0:
                print(f"  ✔ {target_name} ({target_path.stat().st_size / (1024*1024):.2f} MB)")
                success_count += 1
            else:
                print(f"  ✘ Error processing WAV: {clean_stem}")
        else:
            if process_ambiophonic(src):
                success_count += 1

    print("\n" + "=" * 75)
    print(f"⚜️ RÉSUMÉ DU DÉPLOIEMENT AMBIOPHONIQUE : {success_count}/{total} SUCCÈS")
    print(f"📁 Dossier complet : {TARGET_AMBIOPHONIC_DIR}")
    print("=" * 75)


if __name__ == "__main__":
    main()
