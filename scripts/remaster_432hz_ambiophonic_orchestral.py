#!/usr/bin/env python3
"""
remaster_432hz_ambiophonic_orchestral.py
=========================================
THIRTY3 Autonomous Audio Skill: youtube-remaster-mp3-432hz-ambiophonic-orchestral

Pipeline :
1. Ingestion de flux YouTube haute fidélité via yt-dlp.
2. Transposition harmonique naturelle Verdi (440 Hz -> 432 Hz, ratio 54/55, -31.7666 cents).
3. Suréchantillonnage haute résolution SOXR 96 kHz.
4. Égalisation chirurgicale 6 bandes anti-masquage (voix premier plan, encoche anti-cacanne 1100 Hz, anti-fizz 4200 Hz).
5. Affinement dynamique des transitoires d'attaque symphoniques (crystalizer i=1.4).
6. Élargissement holophonique 3D Ambiophonique Orchestral (stereotools mlev=0.98:slev=1.28).
7. Normalisation broadcast EBU R128 à deux passes (-14.0 LUFS / True Peak -1.0 dBTP).
8. Extraction de la miniature carrée et injection des tags ID3v2.3 APIC.
9. Synchronisation multi-destinations permanente vers C:\\Users\\th3th\\Music\\thirty3\\432 hz ambiophonique orchestral\\.
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
DEFAULT_ORCHESTRAL_DIR = PERMANENT_DIR / "432 hz ambiophonique orchestral"

RATIO_432 = "0.98181818"  # 54/55 = 432 / 440 (-31.7666 cents)

# Invariants Acoustiques Souverains THIRTY3 Orchestral 3D
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
    common_yt_args = [
        "--extractor-args", "youtube:player_client=ios,android,web",
        "--js-runtimes", "node",
    ]
    info_cmd = ["yt-dlp", "--dump-json", "--no-warnings"] + common_yt_args + [url]
    if cookies and Path(cookies).exists():
        info_cmd.extend(["--cookies", cookies])
    res = run_command(info_cmd, "Extraction des métadonnées vidéo")
    info = json.loads(res.stdout)

    raw_title = info.get("title", "Unknown_Title")
    raw_artist = info.get("artist") or info.get("uploader", "Unknown_Artist")

    # Nettoyage des motifs parasites YouTube courants
    for pat in [
        r"\(Official Music Video\)", r"\(Official Video\)", r"\(Official Audio\)",
        r"\(Lyric Video\)", r"\(Lyrics Video\)", r"\(Lyrics\)", r"\(Audio\)",
        r"\[Official Music Video\]", r"\[Official Video\]", r"\[Official Audio\]",
        r"\[Lyric Video\]", r"\[Lyrics Video\]", r"\[Lyrics\]", r"\[Audio\]",
        r"\| Official Music Video", r"\| Official Video", r"\| Lyric Video",
    ]:
        raw_title = re.sub(pat, "", raw_title, flags=re.IGNORECASE)

    raw_artist = re.sub(r"\s*-\s*Topic$", "", raw_artist, flags=re.IGNORECASE)
    raw_artist = re.sub(r"VEVO$", "", raw_artist, flags=re.IGNORECASE).strip()

    if " - " in raw_title:
        parts = raw_title.split(" - ", 1)
        if parts[0].strip().lower() == raw_artist.lower():
            raw_title = parts[1].strip()
        elif raw_artist in ("Unknown_Artist", ""):
            raw_artist = parts[0].strip()
            raw_title = parts[1].strip()

    title = clean_filename(raw_title)
    artist = clean_filename(raw_artist)

    raw_audio = temp_dir / "raw_audio.wav"
    dl_cmd = [
        "yt-dlp",
        "--no-warnings",
        "-x",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "-o", str(temp_dir / "download.%(ext)s"),
    ] + common_yt_args + [url]
    if cookies and Path(cookies).exists():
        dl_cmd.extend(["--cookies", cookies])
    run_command(dl_cmd, "Téléchargement du flux audio brut")

    downloaded = list(temp_dir.glob("download.*"))
    if not downloaded:
        print("[!] Aucun fichier audio téléchargé.", file=sys.stderr)
        sys.exit(1)
    shutil.move(downloaded[0], raw_audio)

    # Récupération de la miniature
    thumb_path = None
    thumb_cmd = [
        "yt-dlp",
        "--write-thumbnail",
        "--skip-download",
        "--convert-thumbnails", "jpg",
        "-o", str(temp_dir / "thumb"),
    ] + common_yt_args + [url]
    if cookies and Path(cookies).exists():
        thumb_cmd.extend(["--cookies", cookies])
    subprocess.run(thumb_cmd, capture_output=True)
    thumbs = list(temp_dir.glob("thumb*.jpg"))
    if thumbs:
        thumb_raw = thumbs[0]
        thumb_square = temp_dir / "thumb_square.jpg"
        crop_cmd = [
            "ffmpeg", "-y", "-i", str(thumb_raw),
            "-vf", "crop=w='min(iw,ih)':h='min(iw,ih)',scale=1000:1000:flags=lanczos",
            "-q:v", "2",
            str(thumb_square)
        ]
        if subprocess.run(crop_cmd, capture_output=True).returncode == 0:
            thumb_path = thumb_square
        else:
            thumb_path = thumb_raw

    return raw_audio, thumb_path, title, artist


def measure_loudness_first_pass(audio_path: Path, dsp_chain: str) -> dict:
    filter_desc = f"{dsp_chain},loudnorm=I=-14.0:TP=-1.0:LRA=11:print_format=json"
    cmd = [
        "ffmpeg", "-y", "-i", str(audio_path),
        "-af", filter_desc,
        "-f", "null", "-"
    ]
    res = run_command(cmd, "Passe 1/2 : Mesure de sonie EBU R128")
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
    except Exception as e:
        print(f"[!] Avertissement passe 1 : {e}. Utilisation des paramètres par défaut.")
        return {
            "input_i": "-14.0", "input_tp": "-1.0", "input_lra": "11.0",
            "input_thresh": "-24.0", "target_offset": "0.0"
        }


def render_master(
    raw_audio: Path,
    thumb_path: Path | None,
    output_mp3: Path,
    title: str,
    artist: str,
    measured: dict,
    target_lufs: float = -14.0,
    true_peak: float = -1.0
):
    loudnorm_p2 = (
        f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:"
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
            "-metadata:s:v", 'comment="Cover (front)"'
        ])
    else:
        cmd.extend(["-id3v2_version", "3"])

    output_title = f"{title} (432Hz Ambiophonique Orchestral)"
    cmd.extend([
        "-metadata", f"title={output_title}",
        "-metadata", f"artist={artist}",
        "-metadata", "album=432 Hz Ambiophonique Orchestral Studio",
        "-metadata", "genre=Symphonic Ambiophonic 432Hz",
        "-metadata", "comment=Remastérisé en 432 Hz Ambiophonique Orchestral (Verdi 54/55, M/S 3D, EBU R128)",
        str(output_mp3)
    ])
    run_command(cmd, "Passe 2/2 : Rendu haute fidélité MP3 320 kbps & Injection ID3v2")


def synchronize_files(source_file: Path, artist: str, title: str):
    target_dir = DEFAULT_ORCHESTRAL_DIR / artist.upper()
    target_dir.mkdir(parents=True, exist_ok=True)
    dst_file = target_dir / source_file.name
    if source_file.resolve() != dst_file.resolve():
        try:
            shutil.copy2(source_file, dst_file)
            print(f"  ✔ Master unique déployé : {dst_file}")
        except Exception as e:
            print(f"  [!] Erreur copie {target_dir}: {e}")
    else:
        print(f"  ✔ Master déployé dans son rayon : {dst_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Remastériseur YouTube vers MP3 320 kbps 432 Hz Ambiophonique Orchestral THIRTY3"
    )
    parser.add_argument("--url", required=True, help="URL de la vidéo YouTube")
    parser.add_argument("--artist", type=str, default=None, help="Artiste forcé")
    parser.add_argument("--title", type=str, default=None, help="Titre forcé")
    parser.add_argument("--target-lufs", type=float, default=-14.0, help="Cible EBU R128 (défaut -14.0 LUFS)")
    parser.add_argument("--true-peak", type=float, default=-1.0, help="Plafond True Peak (défaut -1.0 dBTP)")
    parser.add_argument("--output-dir", type=str, default=str(DEFAULT_ORCHESTRAL_DIR), help="Dossier de sortie principal")
    parser.add_argument("--cookies", type=str, default=None, help="Fichier de cookies YouTube optionnel")
    parser.add_argument("--keep-temp", action="store_true", help="Conserver les fichiers temporaires")
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        raw_audio, thumb_path, auto_title, auto_artist = extract_metadata_and_audio(args.url, temp_dir, args.cookies)

        artist = args.artist.strip() if args.artist else auto_artist
        title = args.title.strip() if args.title else auto_title

        measured = measure_loudness_first_pass(raw_audio, DSP_CHAIN_ORCHESTRAL_432)

        final_filename = f"{artist} - {title}_432Hz_Ambiophonique_Orchestral.mp3"
        local_output = temp_dir / final_filename

        render_master(
            raw_audio=raw_audio,
            thumb_path=thumb_path,
            output_mp3=local_output,
            title=title,
            artist=artist,
            measured=measured,
            target_lufs=args.target_lufs,
            true_peak=args.true_peak,
        )

        # Destination finale propre sans doublons lâches
        if out_dir == DEFAULT_ORCHESTRAL_DIR or out_dir == PERMANENT_DIR:
            target_dir = DEFAULT_ORCHESTRAL_DIR / artist.upper()
        else:
            target_dir = out_dir
        target_dir.mkdir(parents=True, exist_ok=True)

        final_dest = target_dir / final_filename
        shutil.copy2(local_output, final_dest)
        print(f"\n[✔] Master unique achevé : {final_dest}")


if __name__ == "__main__":
    main()
