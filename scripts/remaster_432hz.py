#!/usr/bin/env python3
"""
youtube-remaster-mp3-432hz — CLI 432 Hz Harmonic Remastering for YouTube
========================================================================
Transforms a YouTube URL into a studio-grade remastered MP3 (320 kbps)
naturally retuned to the 432 Hz harmonic frequency (A=432 Hz), with
anti-rumble high-pass filtering (30 Hz), dynamic clarity EQ, 2-pass
EBU R128 loudness normalization (-14 LUFS / True Peak -1.0 dBTP),
embedded square cover art, ID3 tags, and auto-sync to C:\\Users\\th3th\\Music\\thirty3.

Dependencies: yt-dlp, ffmpeg, ffprobe (all available on PATH)
Python: 3.10+ (standard library only)
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import argparse
import json
import os
import re
import shutil
import subprocess
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_LUFS_TARGET = -14.0
DEFAULT_TRUE_PEAK = -1.0
DEFAULT_AUDIO_BITRATE = "320k"
DEFAULT_TIMEOUT = 3600  # 60 minutes max (supports full albums)
DEFAULT_THIRTY3_MUSIC_DIR = Path(os.environ.get("THIRTY3_MUSIC_DIR", r"C:\Users\th3th\Music\thirty3"))

GENERIC_WORDS = {
    "instrumental", "instrumentals", "music", "remastered", "source",
    "loop", "tones", "masterpiece", "solfege", "song", "audio", "official",
    "video", "lyrics", "hd", "hq", "4k", "432hz"
}

# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def check_dependency(name: str) -> str:
    """Check that an external tool is available on PATH."""
    path = shutil.which(name)
    if path is None:
        print(
            f"ERROR: Required dependency '{name}' not found on PATH.\n"
            f"Please ensure '{name}' is installed and accessible in your environment.",
            file=sys.stderr,
        )
        sys.exit(1)
    return path


def sanitize_filename(name: str) -> str:
    """Sanitize string for Windows filename safety."""
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned if cleaned else "remastered_432hz_track"


def ensure_dir(path: str | Path) -> Path:
    """Ensure directory exists and return Path object."""
    p = Path(path).resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p


def run_cmd(cmd: list[str], timeout: int = DEFAULT_TIMEOUT, capture: bool = True) -> subprocess.CompletedProcess:
    """Execute subprocess with strict error handling."""
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
    """Extract sample rate of an audio file using ffprobe."""
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
        return 44100


def sync_to_thirty3_music(filepath: str | Path) -> list[str]:
    """Synchronize final audio file to thirty3 music destination and matching artist folders."""
    synced_paths = []
    try:
        src = Path(filepath).resolve()
        if not src.exists() or not src.is_file():
            return synced_paths

        if not DEFAULT_THIRTY3_MUSIC_DIR.exists():
            DEFAULT_THIRTY3_MUSIC_DIR.mkdir(parents=True, exist_ok=True)

        dest_main = (DEFAULT_THIRTY3_MUSIC_DIR / src.name).resolve()
        if src.resolve() != dest_main:
            shutil.copy2(src, dest_main)
            synced_paths.append(str(dest_main))
            print(f"  [thirty3-music] Main synced: {dest_main}")
        else:
            synced_paths.append(str(dest_main))
            print(f"  [thirty3-music] Already in target directory: {dest_main}")

        stem_lower = src.stem.lower()
        for sub in DEFAULT_THIRTY3_MUSIC_DIR.iterdir():
            if sub.is_dir() and not sub.name.startswith("."):
                sub_words = [
                    w for w in sub.name.lower().replace("_", " ").split()
                    if len(w) > 3 and w not in GENERIC_WORDS
                ]
                if sub_words and any(w in stem_lower for w in sub_words):
                    dest_sub = sub / src.name
                    shutil.copy2(src, dest_sub)
                    synced_paths.append(str(dest_sub))
                    print(f"  [thirty3-music] Categorized sync: {dest_sub}")

        # Also copy to dedicated '432 hz' shelf folder if present
        hz_dir = DEFAULT_THIRTY3_MUSIC_DIR / "432 hz"
        if hz_dir.exists() and hz_dir.is_dir():
            dest_hz = hz_dir / src.name
            shutil.copy2(src, dest_hz)
            if str(dest_hz) not in synced_paths:
                synced_paths.append(str(dest_hz))
            print(f"  [thirty3-music] 432 Hz shelf synced: {dest_hz}")
    except Exception as exc:
        print(f"  [thirty3-music] Warning: Sync failed for {filepath}: {exc}", file=sys.stderr)

    return synced_paths


# ---------------------------------------------------------------------------
# Core 432 Hz Remastering Pipeline
# ---------------------------------------------------------------------------

def process_remaster_432hz(
    url: str,
    output_dir: Path,
    target_lufs: float = DEFAULT_LUFS_TARGET,
    true_peak: float = DEFAULT_TRUE_PEAK,
    cookies: str | None = None,
    keep_temp: bool = False,
    output_json: str | None = None,
) -> dict:
    """Execute the full YouTube to 432 Hz Remastered MP3 workflow."""
    ytdlp = check_dependency("yt-dlp")
    ffmpeg = check_dependency("ffmpeg")
    check_dependency("ffprobe")

    ensure_dir(output_dir)
    timestamp = int(time.time())
    temp_dir = output_dir / f".temp_remaster_432hz_{timestamp}"
    ensure_dir(temp_dir)

    print("=" * 70)
    print("▶ YOUTUBE REMASTER MP3 (432 HZ NATURAL HARMONIC)")
    print(f"  URL:         {url}")
    print(f"  Retuning:    440 Hz -> 432 Hz (Ratio: 0.981818)")
    print(f"  Target LUFS: {target_lufs} dB")
    print(f"  True Peak:   {true_peak} dBTP")
    print(f"  Bitrate:     {DEFAULT_AUDIO_BITRATE}")
    print("=" * 70)

    try:
        # Step 1: Extract Video Metadata via yt-dlp
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

        # Step 2: Download raw audio stream (WAV) & thumbnail
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

        # Locate downloaded wav file
        wav_files = list(temp_dir.glob("source*.wav"))
        if not wav_files:
            print("ERROR: Downloaded WAV audio stream not found.", file=sys.stderr)
            sys.exit(1)
        source_wav = wav_files[0]

        # Step 3: Format cover art (crop to square JPEG for universal compatibility)
        cover_path = None
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

        # Step 4: 432 Hz Retuning & DSP Analysis
        source_sr = get_sample_rate(source_wav)
        new_sr = round(source_sr * (432.0 / 440.0))
        print(f"\n[4/5] 432 Hz Retuning (Source SR: {source_sr} Hz -> Asetrate: {new_sr} Hz -> Resample: {source_sr} Hz)...")

        # 432 Hz transposition + highpass 30 Hz + dynamic clarity EQ
        dsp_pre_filters = (
            f"asetrate={new_sr},"
            f"aresample={source_sr},"
            "highpass=f=30,"
            "equalizer=f=3200:t=q:w=1.5:g=1.2,"
            "equalizer=f=12000:t=s:width=1.0:g=1.5"
        )

        print(f"  Pass 1/2: Analyzing integrated loudness at 432 Hz...")
        pass1_cmd = [
            ffmpeg, "-i", str(source_wav),
            "-af", f"{dsp_pre_filters},loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:print_format=json",
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
                print(f"  Input Measured (432Hz): {measured_i} LUFS | Peak: {measured_tp} dBTP | Offset: {target_offset} dB")
            except Exception:
                print("  Warning: Using linear loudnorm defaults for pass 2.")

        # Pass 2: Final render to MP3 320 kbps with metadata & cover art
        final_mp3_path = output_dir / f"{safe_title}_432Hz_Remastered.mp3"
        print(f"  Pass 2/2: Encoding MP3 {DEFAULT_AUDIO_BITRATE} (432Hz Master + ID3)...")

        loudnorm_p2 = (
            f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:"
            f"measured_I={measured_i}:measured_TP={measured_tp}:"
            f"measured_LRA={measured_lra}:measured_thresh={measured_thresh}:"
            f"offset={target_offset}:linear=true"
        )
        full_filter = f"{dsp_pre_filters},{loudnorm_p2}"

        encode_cmd = [ffmpeg, "-y", "-i", str(source_wav)]
        if cover_path:
            encode_cmd.extend(["-i", str(cover_path)])

        encode_cmd.extend(["-af", full_filter])

        if cover_path:
            encode_cmd.extend([
                "-map", "0:a",
                "-map", "1:v",
                "-c:v", "copy",
                "-disposition:v:0", "attached_pic",
            ])
        else:
            encode_cmd.extend(["-map", "0:a"])

        encode_cmd.extend([
            "-codec:a", "libmp3lame",
            "-b:a", DEFAULT_AUDIO_BITRATE,
            "-id3v2_version", "3",
            "-metadata", f"title={title} (432Hz Remastered)",
            "-metadata", f"artist={uploader}",
            "-metadata", "album=Remastered 432Hz (THIRTY3)",
            "-metadata", f"comment=Retuned to 432 Hz and Remastered from {webpage_url}",
            str(final_mp3_path),
        ])

        run_cmd(encode_cmd, capture=False)

        if not final_mp3_path.exists() or final_mp3_path.stat().st_size == 0:
            print("ERROR: Output MP3 was not generated properly.", file=sys.stderr)
            sys.exit(1)

        file_size_mb = final_mp3_path.stat().st_size / (1024 * 1024)
        print(f"  Output MP3:  {final_mp3_path}")
        print(f"  Size:        {file_size_mb:.2f} MB")

        # Step 5: Sync to THIRTY3 permanent vault
        print("\n[5/5] Synchronizing to permanent THIRTY3 library...")
        synced_destinations = sync_to_thirty3_music(final_mp3_path)

        result_data = {
            "status": "success",
            "url": url,
            "title": title,
            "artist": uploader,
            "frequency_tuning": "432 Hz",
            "duration_s": duration_s,
            "file_path": str(final_mp3_path),
            "file_size_mb": round(file_size_mb, 2),
            "bitrate": DEFAULT_AUDIO_BITRATE,
            "target_lufs": target_lufs,
            "true_peak": true_peak,
            "artwork_embedded": cover_path is not None,
            "synced_destinations": synced_destinations,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }

        # Save JSON output if requested
        if output_json:
            out_j = Path(output_json).resolve()
            out_j.parent.mkdir(parents=True, exist_ok=True)
            with open(out_j, "w", encoding="utf-8") as f:
                json.dump(result_data, f, indent=2, ensure_ascii=False)
            print(f"Success! Data written to: {out_j}")

        print("\n" + "=" * 70)
        print("✔ 432 HZ REMASTERING COMPLETED SUCCESSFULLY!")
        print(f"  Track: {final_mp3_path.name}")
        print(f"  Path:  {final_mp3_path}")
        print("=" * 70)

        return result_data

    finally:
        # Cleanup temp directory unless asked to keep
        if not keep_temp and temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)


# ---------------------------------------------------------------------------
# CLI Argument Parser
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="remaster_432hz",
        description="Transform a YouTube link into a 432 Hz studio-grade remastered MP3 (320 kbps).",
    )
    parser.add_argument("--url", required=True, help="YouTube video URL to download, retune to 432 Hz, and remaster")
    parser.add_argument("--output-dir", default="./output", help="Directory where remastered MP3 is saved (default: ./output)")
    parser.add_argument("--target-lufs", type=float, default=DEFAULT_LUFS_TARGET, help="Target loudness in LUFS (default: -14)")
    parser.add_argument("--true-peak", type=float, default=DEFAULT_TRUE_PEAK, help="Target True Peak in dBTP (default: -1.0)")
    parser.add_argument("--cookies", default=None, help="Optional path to cookies.txt for age/auth restricted videos")
    parser.add_argument("--keep-temp", action="store_true", help="Keep temporary WAV and thumbnail files")
    parser.add_argument("--output", default=None, help="Path to write the execution result manifest JSON")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    out_dir = Path(args.output_dir).resolve()
    process_remaster_432hz(
        url=args.url,
        output_dir=out_dir,
        target_lufs=args.target_lufs,
        true_peak=args.true_peak,
        cookies=args.cookies,
        keep_temp=args.keep_temp,
        output_json=args.output,
    )


if __name__ == "__main__":
    main()
