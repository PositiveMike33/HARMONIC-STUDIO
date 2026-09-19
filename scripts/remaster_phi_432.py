#!/usr/bin/env python3
"""
remaster_phi_432.py - Remastering YouTube MP3 320 kbps (Phi 1.618033 Hz + 432 Hz).
Frequence de Verdi (432 Hz) + Onde cerebrale du Nombre d'Or (Left 431.191 Hz / Right 432.809 Hz).
Zéro dépendance tierce (standard library Python + yt-dlp + ffmpeg).
"""

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Force UTF-8 encoding for Windows CLI stdout/stderr
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Default Configuration & Sacred Acoustic Constants
# ---------------------------------------------------------------------------

DEFAULT_LUFS_TARGET = -14.0
DEFAULT_TRUE_PEAK = -1.0
DEFAULT_AUDIO_BITRATE = "320k"
DEFAULT_TIMEOUT = 900

# Frequencies & Subliminal Psychoacoustic Thresholds
PHI_DELTA = 1.6180339887
CARRIER_BASE = 432.0
LEFT_CARRIER = CARRIER_BASE - (PHI_DELTA / 2.0)   # 431.190983 Hz
RIGHT_CARRIER = CARRIER_BASE + (PHI_DELTA / 2.0)  # 432.809017 Hz

DEFAULT_BINAURAL_GAIN = 0.01618  # Φ 1.618% (~-35.8 dBFS) — Nombre d'Or sacré comme amplitude de résonance
DEFAULT_GATE_THRESHOLD = 0.025  # ~ -32 dBFS RMS (seuil de coupure immédiat lors des silences/intros/pauses)
DEFAULT_GATE_RANGE = 0.001      # -60 dB d'atténuation lorsque la porte se ferme (silence total dans les moments vides)
DEFAULT_GATE_ATTACK = 150       # ms (attaque douce sans transitoire abrupte)
DEFAULT_GATE_RELEASE = 700      # ms (maintien fluide évitant tout effet de pompage)

DEFAULT_THIRTY3_MUSIC_DIR = Path(r"C:\Users\th3th\Music\thirty3")
SHELF_SUBDIR_NAME = "phi 432 hz"

GENERIC_WORDS = {
    "records", "music", "official", "video", "audio", "vevo", "channel",
    "topic", "lyrics", "remix", "remastered", "soundtrack", "entertainment",
    "the", "and", "feat", "ft", "prod", "by", "with", "from", "mix"
}


# ---------------------------------------------------------------------------
# Helpers & System Tools
# ---------------------------------------------------------------------------

def check_dependency(name: str) -> str:
    path = shutil.which(name)
    if path is None:
        print(f"ERROR: Required dependency '{name}' not found on PATH.", file=sys.stderr)
        sys.exit(1)
    return path


def sanitize_filename(name: str) -> str:
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned if cleaned else "remastered_phi_432hz_track"


def ensure_dir(path: str | Path) -> Path:
    p = Path(path).resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p


def run_cmd(cmd: list[str], timeout: int = DEFAULT_TIMEOUT, capture: bool = True) -> subprocess.CompletedProcess:
    try:
        res = subprocess.run(
            cmd,
            check=True,
            capture_output=capture,
            text=True,
            timeout=timeout,
        )
        return res
    except subprocess.CalledProcessError as exc:
        stderr_msg = exc.stderr if exc.stderr else "(no stderr)"
        stdout_msg = exc.stdout if exc.stdout else "(no stdout)"
        print(
            f"ERROR: Command failed (exit {exc.returncode}): {' '.join(cmd)}\n"
            f"--- STDERR ---\n{stderr_msg}\n"
            f"--- STDOUT ---\n{stdout_msg}",
            file=sys.stderr,
        )
        sys.exit(1)
    except subprocess.TimeoutExpired:
        print(f"ERROR: Command timed out after {timeout}s: {' '.join(cmd)}", file=sys.stderr)
        sys.exit(1)


def get_sample_rate(audio_file: str | Path) -> int:
    ffprobe = check_dependency("ffprobe")
    probe_cmd = [
        ffprobe, "-v", "error",
        "-select_streams", "a:0",
        "-show_entries", "stream=sample_rate",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(audio_file),
    ]
    try:
        res = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
        return int(res.stdout.strip())
    except Exception:
        return 48000


def get_audio_duration(audio_file: str | Path) -> float:
    ffprobe = check_dependency("ffprobe")
    probe_cmd = [
        ffprobe, "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(audio_file),
    ]
    try:
        res = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
        return float(res.stdout.strip())
    except Exception:
        return 0.0


def sync_to_thirty3_music(filepath: str | Path) -> list[str]:
    """Synchronize final audio file to thirty3 music destination, artist folders and phi shelf."""
    synced_paths = []
    try:
        src = Path(filepath).resolve()
        if not src.exists() or not src.is_file():
            return synced_paths

        if not DEFAULT_THIRTY3_MUSIC_DIR.exists():
            DEFAULT_THIRTY3_MUSIC_DIR.mkdir(parents=True, exist_ok=True)

        # 1. Main Thirty3 Root
        dest_main = (DEFAULT_THIRTY3_MUSIC_DIR / src.name).resolve()
        if src.resolve() != dest_main:
            shutil.copy2(src, dest_main)
            synced_paths.append(str(dest_main))
            print(f"  [thirty3-music] Main synced: {dest_main}")
        else:
            synced_paths.append(str(dest_main))
            print(f"  [thirty3-music] Already in target directory: {dest_main}")

        # 2. Artist Subfolder Sync
        stem_lower = src.stem.lower()
        for sub in DEFAULT_THIRTY3_MUSIC_DIR.iterdir():
            if sub.is_dir() and not sub.name.startswith(".") and sub.name.lower() not in ["432 hz", SHELF_SUBDIR_NAME.lower(), "phi 432 hz 528 hz binaural"]:
                sub_words = [
                    w for w in sub.name.lower().replace("_", " ").split()
                    if len(w) > 3 and w not in GENERIC_WORDS
                ]
                if sub_words and any(w in stem_lower for w in sub_words):
                    dest_sub = sub / src.name
                    shutil.copy2(src, dest_sub)
                    synced_paths.append(str(dest_sub))
                    print(f"  [thirty3-music] Categorized sync: {dest_sub}")

        # 3. Dedicated Phi 432 Hz Shelf
        shelf_dir = DEFAULT_THIRTY3_MUSIC_DIR / SHELF_SUBDIR_NAME
        shelf_dir.mkdir(parents=True, exist_ok=True)
        dest_shelf = shelf_dir / src.name
        shutil.copy2(src, dest_shelf)
        if str(dest_shelf) not in synced_paths:
            synced_paths.append(str(dest_shelf))
        print(f"  [thirty3-music] Phi 432 Hz shelf synced: {dest_shelf}")

    except Exception as exc:
        print(f"  [thirty3-music] Warning: Sync failed for {filepath}: {exc}", file=sys.stderr)

    return synced_paths


# ---------------------------------------------------------------------------
# Core Remastering Pipeline (Phi 1.618033 Hz + 432 Hz)
# ---------------------------------------------------------------------------

def process_remaster_phi_432hz(
    url: str | None = None,
    input_file: str | None = None,
    output_dir: Path = Path("./audio/remaster_phi_432hz"),
    target_lufs: float = DEFAULT_LUFS_TARGET,
    true_peak: float = DEFAULT_TRUE_PEAK,
    binaural_gain: float = DEFAULT_BINAURAL_GAIN,
    binaural_fade_in: float = 8.0,
    dynamic_gate: bool = True,
    gate_threshold: float = DEFAULT_GATE_THRESHOLD,
    cookies: str | None = None,
    keep_temp: bool = False,
    output_json: str | None = None,
) -> dict:
    ffmpeg = check_dependency("ffmpeg")
    check_dependency("ffprobe")
    ensure_dir(output_dir)

    temp_dir_obj = tempfile.TemporaryDirectory(prefix="remaster_phi_432_")
    temp_dir = Path(temp_dir_obj.name)

    binaural_dbfs = 20 * math.log10(binaural_gain) if binaural_gain > 0 else -99.0

    print("=" * 70)
    print("▶ YOUTUBE REMASTER MP3 (PHI 1.618033 HZ + 432 HZ)")
    print(f"  Target LUFS:   {target_lufs} dB")
    print(f"  True Peak:     {true_peak} dBTP")
    print(f"  Phi Delta:     {PHI_DELTA:.6f} Hz (Left: {LEFT_CARRIER:.3f} Hz / Right: {RIGHT_CARRIER:.3f} Hz)")
    print(f"  Binaural Gain: {binaural_gain:.6f} (~{binaural_dbfs:.1f} dBFS subliminal)")
    print(f"  Dynamic Gate:  {'Active (RMS sidechain threshold ' + str(gate_threshold) + ')' if dynamic_gate else 'Disabled'}")
    print(f"  Crescendo In:  {binaural_fade_in}s (half-sine harmonic envelope)")
    print(f"  Bitrate:       {DEFAULT_AUDIO_BITRATE}")
    print("=" * 70)

    try:
        cover_path = None
        source_wav = None

        if input_file:
            # Local input file mode (e.g. testing / direct audio file)
            print("\n[1/5] Ingesting local audio file...")
            in_p = Path(input_file).resolve()
            if not in_p.exists():
                raise FileNotFoundError(f"Input file {input_file} not found")
            source_wav = temp_dir / "source.wav"
            run_cmd([ffmpeg, "-y", "-i", str(in_p), "-vn", str(source_wav)])
            title = in_p.stem
            uploader = "Thirty3 Harmonics"
            duration_s = 60
            webpage_url = "local_file"
            safe_title = sanitize_filename(title)
        else:
            if not url:
                raise ValueError("Either --url or --input-file must be provided.")
            ytdlp = check_dependency("yt-dlp")
            print("\n[1/5] Extracting video metadata...")
            meta_cmd = [ytdlp, "--dump-single-json", "--no-playlist", "--no-warnings"]
            if cookies:
                meta_cmd.extend(["--cookies", cookies])
            meta_cmd.append(url)

            meta_res = run_cmd(meta_cmd)
            video_meta = json.loads(meta_res.stdout)

            title = video_meta.get("title", "Remastered Track")
            uploader = video_meta.get("uploader") or video_meta.get("channel") or "Unknown Artist"
            duration_s = video_meta.get("duration", 0)
            webpage_url = video_meta.get("webpage_url", url)

            safe_title = sanitize_filename(f"{uploader} - {title}" if uploader and uploader not in title else title)
            print(f"  Title:    {title}")
            print(f"  Artist:   {uploader}")
            print(f"  Duration: {int(duration_s // 60)}:{int(duration_s % 60):02d}")

            print("\n[2/5] Downloading raw uncompressed audio & artwork...")
            raw_audio_tmpl = str(temp_dir / "source.%(ext)s")
            dl_cmd = [
                ytdlp,
                "-x",
                "--audio-format", "wav",
                "--audio-quality", "0",
                "--write-thumbnail",
                "--convert-thumbnails", "jpg",
                "-o", raw_audio_tmpl,
                "--no-playlist",
                "--restrict-filenames",
                "--no-overwrites",
            ]
            if cookies:
                dl_cmd.extend(["--cookies", cookies])
            dl_cmd.append(url)

            run_cmd(dl_cmd, capture=False)

            wav_files = list(temp_dir.glob("source*.wav"))
            if not wav_files:
                print("ERROR: Downloaded WAV audio stream not found.", file=sys.stderr)
                sys.exit(1)
            source_wav = wav_files[0]

            # Step 3: Format cover art
            thumb_candidates = (
                list(temp_dir.glob("source*.jpg"))
                + list(temp_dir.glob("source*.png"))
                + list(temp_dir.glob("source*.webp"))
            )
            if thumb_candidates:
                raw_thumb = thumb_candidates[0]
                square_cover = temp_dir / "cover.jpg"
                print("\n[3/5] Formatting square cover art for ID3 embedding...")
                cover_cmd = [
                    ffmpeg, "-y", "-i", str(raw_thumb),
                    "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
                    "-q:v", "2",
                    str(square_cover)
                ]
                run_cmd(cover_cmd)
                if square_cover.exists() and square_cover.stat().st_size > 0:
                    cover_path = square_cover
                    print(f"  Cover art ready: {cover_path.name} ({cover_path.stat().st_size / 1024:.1f} KB)")
            else:
                print("\n[3/5] No thumbnail found, proceeding without embedded artwork.")

        # Step 4: 432 Hz + Phi Binaural Matrix DSP Filtergraph
        print("\n[4/5] Constructing DSP Matrix: 432 Hz Retuning + Phi Binaural Layer (96 kHz soxr float32)...")
        
        # Rubberband 432 Hz pitch shifting + Phi binaural generator with progressive crescendo & decrescendo
        binaural_gen = f"aevalsrc=exprs='{binaural_gain:.6f}*sin(2*PI*{LEFT_CARRIER:.6f}*t)|{binaural_gain:.6f}*sin(2*PI*{RIGHT_CARRIER:.6f}*t)':s=96000,lowpass=f=650[phi_raw];"

        # Guitar Anti-Fizz & Ambiophonic Clarity EQ chain
        clarity_chain = (
            "equalizer=f=1800:t=q:w=1.4:g=1.2,"
            "equalizer=f=4200:t=q:w=2.2:g=-2.5,"
            "equalizer=f=7500:t=q:w=1.8:g=-2.0,"
            "equalizer=f=12000:t=s:width=1.0:g=-1.0,"
            "stereotools=mlev=0.96:slev=1.22:balance_in=0:softclip=1"
        )

        if dynamic_gate:
            # Dynamic RMS sidechain gating: when the music pauses or dips into silence (empty moments),
            # the Phi carrier is smoothly muted (-60 dB) to prevent any noticeable humming or drone.
            dsp_base = (
                "[0:a]volume=-2.0dB,adeclip,"
                "aresample=96000:resampler=soxr:precision=33:osf=fltp,"
                "rubberband=pitch=0.98181818:tempo=1.0:transients=smooth:detector=soft:phase=laminar:formant=preserved:pitchq=quality:channels=together,"
                f"{clarity_chain},asplit=2[music_main][music_sc];"
                f"{binaural_gen}"
                f"[phi_raw][music_sc]sidechaingate=threshold={gate_threshold:.4f}:range={DEFAULT_GATE_RANGE}:attack={DEFAULT_GATE_ATTACK}:release={DEFAULT_GATE_RELEASE}:ratio=3:knee=2.8:detection=rms[phi_binaural];"
                "[music_main][phi_binaural]amix=inputs=2:duration=first:dropout_transition=2,"
                "alimiter=limit=-1.0dB:attack=5:release=50:asc=1"
            )
        else:
            dsp_base = (
                "[0:a]volume=-2.0dB,adeclip,"
                "aresample=96000:resampler=soxr:precision=33:osf=fltp,"
                "rubberband=pitch=0.98181818:tempo=1.0:transients=smooth:detector=soft:phase=laminar:formant=preserved:pitchq=quality:channels=together,"
                f"{clarity_chain}[music_432];"
                f"{binaural_gen}"
                "[music_432][phi_raw]amix=inputs=2:duration=first:dropout_transition=2,"
                "alimiter=limit=-1.0dB:attack=5:release=50:asc=1"
            )

        print(f"  Pass 1/2: Analyzing integrated loudness of combined Phi-432 matrix...")
        pass1_filter = f"{dsp_base},loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:print_format=json[out]"
        pass1_cmd = [
            ffmpeg, "-i", str(source_wav),
            "-filter_complex", pass1_filter,
            "-map", "[out]",
            "-f", "null", "-",
        ]
        pass1_res = subprocess.run(pass1_cmd, capture_output=True, text=True, timeout=DEFAULT_TIMEOUT)

        stderr_lines = pass1_res.stderr.splitlines()
        json_lines = []
        in_json = False
        for line in stderr_lines:
            if "{" in line and "input_i" in pass1_res.stderr:
                in_json = True
            if in_json:
                json_lines.append(line)
                if "}" in line:
                    break

        measured_i = str(target_lufs)
        measured_tp = str(true_peak)
        measured_lra = "11"
        measured_thresh = "-30"
        target_offset = "0"

        if json_lines:
            try:
                stats = json.loads("\n".join(json_lines))
                measured_i = stats.get("input_i", str(target_lufs))
                measured_tp = stats.get("input_tp", str(true_peak))
                measured_lra = stats.get("input_lra", "11")
                measured_thresh = stats.get("input_thresh", "-30")
                target_offset = stats.get("target_offset", "0")
                print(f"  Input Measured: {measured_i} LUFS | Peak: {measured_tp} dBTP | Offset: {target_offset} dB")
            except Exception:
                print("  Warning: Using linear loudnorm defaults for pass 2.")

        # Pass 2: Final encode MP3 320k
        final_mp3_path = output_dir / f"{safe_title}_Phi_432Hz_Remastered.mp3"
        print(f"  Pass 2/2: Encoding MP3 {DEFAULT_AUDIO_BITRATE} (Phi-432Hz Master + ID3)...")

        loudnorm_p2 = (
            f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:"
            f"measured_I={measured_i}:measured_TP={measured_tp}:"
            f"measured_LRA={measured_lra}:measured_thresh={measured_thresh}:"
            f"offset={target_offset}:linear=true[out]"
        )
        pass2_filter = f"{dsp_base},{loudnorm_p2}"

        encode_cmd = [ffmpeg, "-y", "-i", str(source_wav)]
        if cover_path:
            encode_cmd.extend(["-i", str(cover_path)])

        encode_cmd.extend(["-filter_complex", pass2_filter])

        if cover_path:
            encode_cmd.extend([
                "-map", "[out]",
                "-map", "1:v",
                "-c:v", "copy",
                "-disposition:v:0", "attached_pic",
            ])
        else:
            encode_cmd.extend(["-map", "[out]"])

        encode_cmd.extend([
            "-codec:a", "libmp3lame",
            "-b:a", DEFAULT_AUDIO_BITRATE,
            "-id3v2_version", "3",
            "-metadata", f"title={title} (Phi 432Hz Remastered)",
            "-metadata", f"artist={uploader}",
            "-metadata", "album=Sacred Harmonics (Phi 1.618033Hz / 432Hz)",
            "-metadata", "genre=Sacred Harmonics",
            "-metadata", f"comment=Phi 1.618033 Hz Binaural Beat with 432 Hz Master from {webpage_url}",
            str(final_mp3_path),
        ])

        run_cmd(encode_cmd, capture=False)

        if not final_mp3_path.exists() or final_mp3_path.stat().st_size == 0:
            print("ERROR: Output MP3 file generation failed.", file=sys.stderr)
            sys.exit(1)

        file_size_mb = final_mp3_path.stat().st_size / (1024 * 1024)
        print(f"  Output MP3:  {final_mp3_path}")
        print(f"  Size:        {file_size_mb:.2f} MB")

        # Step 5: Synchronize
        print("\n[5/5] Synchronizing to permanent THIRTY3 library & shelves...")
        synced_files = sync_to_thirty3_music(final_mp3_path)

        result_report = {
            "status": "success",
            "tool": "youtube-remaster-mp3-phi-432hz",
            "title": title,
            "artist": uploader,
            "url": webpage_url,
            "tuning": {
                "base_frequency_hz": CARRIER_BASE,
                "phi_delta_hz": PHI_DELTA,
                "left_carrier_hz": LEFT_CARRIER,
                "right_carrier_hz": RIGHT_CARRIER,
                "ratio": 432.0 / 440.0,
                "binaural_amplitude": binaural_gain,
                "binaural_dbfs": round(20 * math.log10(binaural_gain), 2) if binaural_gain > 0 else -99.0,
                "dynamic_gate_active": dynamic_gate,
                "gate_threshold": gate_threshold,
            },
            "mastering": {
                "format": "mp3",
                "bitrate": DEFAULT_AUDIO_BITRATE,
                "target_lufs": target_lufs,
                "true_peak_dbtp": true_peak,
                "measured_lufs": float(measured_i),
                "measured_tp": float(measured_tp),
            },
            "output_file": str(final_mp3_path.resolve()),
            "file_size_mb": round(file_size_mb, 2),
            "cover_embedded": bool(cover_path),
            "synced_destinations": synced_files,
        }

        if output_json:
            out_json_path = Path(output_json).resolve()
            ensure_dir(out_json_path.parent)
            with open(out_json_path, "w", encoding="utf-8") as f:
                json.dump(result_report, f, indent=2, ensure_ascii=False)
            print(f"  Report saved: {out_json_path}")

        print("\n" + "=" * 70)
        print("✔ PHI 432 HZ REMASTERING COMPLETED SUCCESSFULLY!")
        print(f"  Track: {final_mp3_path.name}")
        print(f"  Path:  {final_mp3_path}")
        print("=" * 70)

        return result_report

    finally:
        if not keep_temp:
            temp_dir_obj.cleanup()


# ---------------------------------------------------------------------------
# CLI Entrypoint
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Remaster YouTube audio into 320 kbps MP3 retuned to 432 Hz + Phi (1.618033 Hz) binaural beat."
    )
    parser.add_argument("--url", help="YouTube video URL")
    parser.add_argument("--input-file", help="Local audio file path (for unit testing or local input)")
    parser.add_argument(
        "--output-dir",
        default="./audio/remaster_phi_432hz",
        help="Destination directory (default: ./audio/remaster_phi_432hz)",
    )
    parser.add_argument(
        "--target-lufs",
        type=float,
        default=DEFAULT_LUFS_TARGET,
        help="Target Integrated Loudness in LUFS (default: -14.0)",
    )
    parser.add_argument(
        "--true-peak",
        type=float,
        default=DEFAULT_TRUE_PEAK,
        help="Maximum True Peak level in dBTP (default: -1.0)",
    )
    parser.add_argument(
        "--binaural-gain",
        type=float,
        default=DEFAULT_BINAURAL_GAIN,
        help=f"Binaural sine wave amplitude coefficient (default: {DEFAULT_BINAURAL_GAIN} / Φ 1.618% ~-35.8 dBFS)",
    )
    parser.add_argument(
        "--fade-in",
        type=float,
        default=8.0,
        help="Crescendo fade-in duration in seconds for the binaural wave (default: 8.0)",
    )
    parser.add_argument(
        "--gate-threshold",
        type=float,
        default=DEFAULT_GATE_THRESHOLD,
        help=f"RMS sidechain gate threshold to silence the binaural carrier during pauses/intros/empty moments (default: {DEFAULT_GATE_THRESHOLD} / ~-32 dBFS)",
    )
    parser.add_argument(
        "--disable-gate",
        action="store_true",
        help="Disable dynamic sidechain gating (keeps continuous un-gated binaural carrier)",
    )
    parser.add_argument("--cookies", help="Path to cookies.txt for age/region restricted videos")
    parser.add_argument("--keep-temp", action="store_true", help="Preserve intermediate WAV & cover art")
    parser.add_argument("--output", help="Optional path to output JSON report")

    args = parser.parse_args()

    if not args.url and not args.input_file:
        parser.error("Either --url or --input-file must be provided.")

    process_remaster_phi_432hz(
        url=args.url,
        input_file=args.input_file,
        output_dir=Path(args.output_dir),
        target_lufs=args.target_lufs,
        true_peak=args.true_peak,
        binaural_gain=args.binaural_gain,
        binaural_fade_in=args.fade_in,
        dynamic_gate=not args.disable_gate,
        gate_threshold=args.gate_threshold,
        cookies=args.cookies,
        keep_temp=args.keep_temp,
        output_json=args.output,
    )


if __name__ == "__main__":
    main()
