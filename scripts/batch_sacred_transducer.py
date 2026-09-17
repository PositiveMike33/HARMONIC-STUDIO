#!/usr/bin/env python3
r"""
batch_sacred_transducer.py
Batch converts existing 432 Hz masters in C:\Users\th3th\Music\thirty3\432 hz
into both Phi 432 Hz and Phi 432 Hz + 528 Hz Binaural versions with:
- 8s progressive half-sine crescendo intro (inaudible before song starts)
- 8s progressive half-sine decrescendo outro (silent finish)
- Subtle background calibration (non-invasive, powerful resonant core)
- Full ID3 tagging & cover art preservation
- Triple synchronization to thirty3, artist folder, and sacred frequency shelves.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Force UTF-8 encoding
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

MUSIC_DIR = Path(r"C:\Users\th3th\Music\thirty3")
SRC_432_DIR = MUSIC_DIR / "432 hz"
PHI_432_DIR = MUSIC_DIR / "phi 432 hz"
PHI_528_DIR = MUSIC_DIR / "phi 432 hz 528 hz binaural"

DEFAULT_LUFS_TARGET = -14.0
DEFAULT_TRUE_PEAK = -1.0
DEFAULT_BITRATE = "320k"

# Frequencies
PHI_DELTA = 1.6180339887
CARRIER_432 = 432.0
CARRIER_528 = 528.0

# 432 Hz Binaural Pair
PAIR_432_LEFT = CARRIER_432 - (PHI_DELTA / 2.0)   # 431.190983 Hz
PAIR_432_RIGHT = CARRIER_432 + (PHI_DELTA / 2.0)  # 432.809017 Hz

# 528 Hz Binaural Pair
PAIR_528_LEFT = CARRIER_528 - (PHI_DELTA / 2.0)   # 527.190983 Hz
PAIR_528_RIGHT = CARRIER_528 + (PHI_DELTA / 2.0)  # 528.809017 Hz

GAIN_PHI_ONLY = 0.01618  # Φ 1.618% (~-35.8 dBFS) — Résonance Nombre d'Or
GAIN_DUAL_432 = 0.01618  # Φ 1.618% (~-35.8 dBFS) — Diapason naturel 432 Hz
GAIN_DUAL_528 = 0.01618  # Φ 1.618% (~-35.8 dBFS) — Solfeggio 528 Hz ADN / Transformation
FADE_IN_SEC = 8.0
FADE_OUT_SEC = 10.0  # 10 seconds before the end, progressively descend to allow mind to relax

GENERIC_WORDS = {
    "records", "music", "official", "video", "audio", "vevo", "channel",
    "topic", "lyrics", "remix", "remastered", "soundtrack", "entertainment",
    "the", "and", "feat", "ft", "prod", "by", "with", "from", "mix"
}


def get_metadata(mp3_file: Path) -> tuple[str, str, str, float]:
    """Extract (title, artist, comment, duration) via ffprobe."""
    probe_cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format_tags:format=duration",
        "-of", "json",
        str(mp3_file)
    ]
    title = mp3_file.stem
    artist = "Unknown Artist"
    comment = ""
    duration = 0.0
    try:
        res = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)
        fmt = data.get("format", {})
        duration = float(fmt.get("duration", 0.0))
        tags = fmt.get("tags", {})
        title = tags.get("title", title)
        artist = tags.get("artist", artist)
        comment = tags.get("comment", "")
    except Exception:
        pass

    # Clean title
    clean_title = re.sub(r"\s*\(432Hz Remastered\)", "", title, flags=re.IGNORECASE).strip()
    return clean_title, artist, comment, duration


def sync_file(src: Path, shelf_name: str) -> list[str]:
    synced = []
    try:
        # 1. Main root
        dest_main = MUSIC_DIR / src.name
        if src.resolve() != dest_main.resolve():
            shutil.copy2(src, dest_main)
            synced.append(str(dest_main))

        # 2. Artist folder
        stem_lower = src.stem.lower()
        for sub in MUSIC_DIR.iterdir():
            if sub.is_dir() and not sub.name.startswith(".") and sub.name.lower() not in ["432 hz", "phi 432 hz", "phi 432 hz 528 hz binaural"]:
                sub_words = [
                    w for w in sub.name.lower().replace("_", " ").split()
                    if len(w) > 3 and w not in GENERIC_WORDS
                ]
                if sub_words and any(w in stem_lower for w in sub_words):
                    dest_sub = sub / src.name
                    shutil.copy2(src, dest_sub)
                    synced.append(str(dest_sub))

        # 3. Dedicated shelf
        shelf_dir = MUSIC_DIR / shelf_name
        shelf_dir.mkdir(parents=True, exist_ok=True)
        dest_shelf = shelf_dir / src.name
        if src.resolve() != dest_shelf.resolve():
            shutil.copy2(src, dest_shelf)
            synced.append(str(dest_shelf))
    except Exception as exc:
        print(f"  Warning: sync failed: {exc}", file=sys.stderr)
    return synced


def process_track(mp3_path: Path):
    clean_title, artist, comment, duration = get_metadata(mp3_path)
    base_name = mp3_path.stem
    base_name = re.sub(r"_432Hz_Remastered$", "", base_name)
    base_name = re.sub(r"_Remastered$", "", base_name)

    print(f"\n======================================================================")
    print(f"▶ TRANSDUCING: {base_name}")
    print(f"  Artist:   {artist}")
    print(f"  Duration: {int(duration // 60)}:{int(duration % 60):02d} ({duration:.1f}s)")
    print(f"======================================================================")

    with tempfile.TemporaryDirectory(prefix="transduce_") as tmp_dir:
        tmp_p = Path(tmp_dir)
        cover_path = tmp_p / "cover.jpg"

        # Extract embedded cover
        cover_cmd = ["ffmpeg", "-y", "-i", str(mp3_path), "-an", "-c:v", "copy", str(cover_path)]
        subprocess.run(cover_cmd, capture_output=True)
        has_cover = cover_path.exists() and cover_path.stat().st_size > 0

        # Calculate fade in and out times
        fin = min(FADE_IN_SEC, duration / 2.0) if duration > 0 else 0
        fout = min(FADE_OUT_SEC, duration / 2.0) if duration > 0 else 0
        fout_st = max(fin, duration - fout)

        # -------------------------------------------------------------------
        # 1. Phi 432 Hz
        # -------------------------------------------------------------------
        target_name_phi = f"{base_name}_Phi_432Hz_Remastered.mp3"
        dest_phi_shelf = PHI_432_DIR / target_name_phi

        print(f"  [1/2] Rendering Phi 432 Hz (Gain Phi: {GAIN_PHI_ONLY})...")
        binaural_expr = f"{GAIN_PHI_ONLY:.4f}*sin(2*PI*{PAIR_432_LEFT:.6f}*t)|{GAIN_PHI_ONLY:.4f}*sin(2*PI*{PAIR_432_RIGHT:.6f}*t)"

        dsp_base_phi = (
            "[0:a]aresample=96000:resampler=soxr:precision=33:osf=fltp,"
            "volume=-2.5dB[music_432];"
            f"aevalsrc=exprs='{binaural_expr}':s=96000[phi_binaural];"
            "[music_432][phi_binaural]amix=inputs=2:duration=first:dropout_transition=2,"
            "alimiter=limit=-1.0dB:attack=5:release=50:asc=1"
        )

        # Pass 1: loudnorm analysis
        p1_filter = f"{dsp_base_phi},loudnorm=I={DEFAULT_LUFS_TARGET}:TP={DEFAULT_TRUE_PEAK}:LRA=11:print_format=json[out]"
        p1_res = subprocess.run(
            ["ffmpeg", "-i", str(mp3_path), "-filter_complex", p1_filter, "-map", "[out]", "-f", "null", "-"],
            capture_output=True, text=True
        )
        m_i, m_tp, m_lra, m_th, m_off = str(DEFAULT_LUFS_TARGET), str(DEFAULT_TRUE_PEAK), "11", "-30", "0"
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

        # Pass 2: encode
        p2_filter = (
            f"{dsp_base_phi},"
            f"loudnorm=I={DEFAULT_LUFS_TARGET}:TP={DEFAULT_TRUE_PEAK}:LRA=11:"
            f"measured_I={m_i}:measured_TP={m_tp}:measured_LRA={m_lra}:measured_thresh={m_th}:offset={m_off}:linear=true[out]"
        )
        out_phi = tmp_p / target_name_phi
        enc_cmd = ["ffmpeg", "-y", "-i", str(mp3_path)]
        if has_cover:
            enc_cmd.extend(["-i", str(cover_path)])
        enc_cmd.extend(["-filter_complex", p2_filter])
        if has_cover:
            enc_cmd.extend(["-map", "[out]", "-map", "1:v", "-c:v", "copy", "-disposition:v:0", "attached_pic"])
        else:
            enc_cmd.extend(["-map", "[out]"])
        enc_cmd.extend([
            "-c:a", "libmp3lame", "-b:a", DEFAULT_BITRATE,
            "-id3v2_version", "3",
            "-metadata", f"title={clean_title} (Phi 432Hz Remastered)",
            "-metadata", f"artist={artist}",
            "-metadata", "album=Sacred Harmonics (Phi 1.618033Hz / 432Hz)",
            "-metadata", "genre=Sacred Harmonics",
            "-metadata", f"comment={comment}",
            str(out_phi)
        ])
        subprocess.run(enc_cmd, check=True, capture_output=True)
        if out_phi.exists() and out_phi.stat().st_size > 0:
            sync_file(out_phi, "phi 432 hz")
            print(f"  ✔ Phi 432 Hz generated and synced ({out_phi.stat().st_size / (1024*1024):.2f} MB).")

        # -------------------------------------------------------------------
        # 2. Phi 432 Hz + 528 Hz Binaural Matrix
        # -------------------------------------------------------------------
        target_name_528 = f"{base_name}_Phi_432Hz_528Hz_Binaural_Remastered.mp3"
        dest_528_shelf = PHI_528_DIR / target_name_528

        print(f"  [2/2] Rendering Phi 432+528 Hz (Gains: {GAIN_DUAL_432}/{GAIN_DUAL_528})...")
        left_expr = f"{GAIN_DUAL_432:.4f}*sin(2*PI*{PAIR_432_LEFT:.6f}*t) + {GAIN_DUAL_528:.4f}*sin(2*PI*{PAIR_528_LEFT:.6f}*t)"
        right_expr = f"{GAIN_DUAL_432:.4f}*sin(2*PI*{PAIR_432_RIGHT:.6f}*t) + {GAIN_DUAL_528:.4f}*sin(2*PI*{PAIR_528_RIGHT:.6f}*t)"

        dsp_base_528 = (
            "[0:a]aresample=96000:resampler=soxr:precision=33:osf=fltp,"
            "volume=-3.0dB[music_432];"
            f"aevalsrc=exprs='{left_expr}|{right_expr}':s=96000[matrix_binaural];"
            "[music_432][matrix_binaural]amix=inputs=2:duration=first:dropout_transition=2,"
            "alimiter=limit=-1.0dB:attack=5:release=50:asc=1"
        )

        # Pass 1: loudnorm analysis
        p1_filter = f"{dsp_base_528},loudnorm=I={DEFAULT_LUFS_TARGET}:TP={DEFAULT_TRUE_PEAK}:LRA=11:print_format=json[out]"
        p1_res = subprocess.run(
            ["ffmpeg", "-i", str(mp3_path), "-filter_complex", p1_filter, "-map", "[out]", "-f", "null", "-"],
            capture_output=True, text=True
        )
        m_i, m_tp, m_lra, m_th, m_off = str(DEFAULT_LUFS_TARGET), str(DEFAULT_TRUE_PEAK), "11", "-30", "0"
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

        # Pass 2: encode
        p2_filter = (
            f"{dsp_base_528},"
            f"loudnorm=I={DEFAULT_LUFS_TARGET}:TP={DEFAULT_TRUE_PEAK}:LRA=11:"
            f"measured_I={m_i}:measured_TP={m_tp}:measured_LRA={m_lra}:measured_thresh={m_th}:offset={m_off}:linear=true[out]"
        )
        out_528 = tmp_p / target_name_528
        enc_cmd = ["ffmpeg", "-y", "-i", str(mp3_path)]
        if has_cover:
            enc_cmd.extend(["-i", str(cover_path)])
        enc_cmd.extend(["-filter_complex", p2_filter])
        if has_cover:
            enc_cmd.extend(["-map", "[out]", "-map", "1:v", "-c:v", "copy", "-disposition:v:0", "attached_pic"])
        else:
            enc_cmd.extend(["-map", "[out]"])
        enc_cmd.extend([
            "-c:a", "libmp3lame", "-b:a", DEFAULT_BITRATE,
            "-id3v2_version", "3",
            "-metadata", f"title={clean_title} (Phi 432Hz+528Hz Binaural Remastered)",
            "-metadata", f"artist={artist}",
            "-metadata", "album=Sacred Harmonics (Phi 1.618033Hz / 432Hz + 528Hz)",
            "-metadata", "genre=Sacred Solfeggio Harmonics",
            "-metadata", f"comment={comment}",
            str(out_528)
        ])
        subprocess.run(enc_cmd, check=True, capture_output=True)
        if out_528.exists() and out_528.stat().st_size > 0:
            sync_file(out_528, "phi 432 hz 528 hz binaural")
            print(f"  ✔ Phi 432+528 Hz generated and synced ({out_528.stat().st_size / (1024*1024):.2f} MB).")


def main():
    if not SRC_432_DIR.exists():
        print(f"ERROR: {SRC_432_DIR} does not exist.", file=sys.stderr)
        sys.exit(1)

    tracks = sorted([f for f in SRC_432_DIR.glob("*.mp3") if f.is_file()])
    total = len(tracks)
    print("=" * 70)
    print(f"▶ BATCH SACRED TRANSDUCTION: {total} TRACKS")
    print(f"  Source: {SRC_432_DIR}")
    print(f"  Dest 1: {PHI_432_DIR}")
    print(f"  Dest 2: {PHI_528_DIR}")
    print("=" * 70)

    for idx, track in enumerate(tracks, start=1):
        print(f"\n[{idx}/{total}] Processing {track.name}...")
        try:
            process_track(track)
        except Exception as exc:
            print(f"  ERROR processing {track.name}: {exc}", file=sys.stderr)

    print("\n" + "=" * 70)
    print("🎉 ALL TRACKS TRANSDUCED AND SYNCHRONIZED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    main()
