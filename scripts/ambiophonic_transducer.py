#!/usr/bin/env python3
"""
ambiophonic_transducer.py
=========================
THIRTY3 Autonomous Audio Skill: thirty3-432hz-ambiophonic

Commands:
- convert : Transmute a single local audio file (MP3, WAV, FLAC, M4A) to 432 Hz Ambiophonique 3D.
- batch   : Recursively scan a library folder, detect 432 Hz masters vs 440 Hz tracks,
            and batch convert them into C:\\Users\\th3th\\Music\\thirty3\\432 hz ambiophonique\\.
- verify  : Analyze audio file(s) for loudness (LUFS), True Peak, and ambiophonic compliance.
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

RATIO_432 = "0.98181818"  # 54/55

DSP_FULL_432_AMBIOPHONIC = (
    f"rubberband=pitch={RATIO_432}:transients=smooth:detector=soft,"
    "aresample=96000:resampler=soxr:precision=33:osf=fltp,"
    "equalizer=f=1800:t=q:w=1.4:g=1.2,"
    "equalizer=f=4200:t=q:w=2.2:g=-2.5,"
    "equalizer=f=7500:t=q:w=1.8:g=-2.0,"
    "equalizer=f=12000:t=s:width=1.0:g=-1.0,"
    "stereotools=mlev=0.96:slev=1.22:balance_in=0:softclip=1"
)

DSP_SPATIAL_ONLY = (
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


def extract_cover_art(audio_path: Path, temp_dir: Path) -> Path | None:
    cover_path = temp_dir / "cover.jpg"
    cmd = [
        "ffmpeg", "-y", "-i", str(audio_path),
        "-an", "-vcodec", "copy",
        str(cover_path)
    ]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode == 0 and cover_path.exists() and cover_path.stat().st_size > 0:
        return cover_path
    return None


def get_metadata(audio_path: Path) -> tuple[str, str, str]:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format_tags=title,artist,album",
        "-of", "default=noprint_wrappers=1",
        str(audio_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    title, artist, album = "", "", ""
    for line in res.stdout.splitlines():
        lower = line.lower()
        if lower.startswith("tag:title="):
            title = line.split("=", 1)[1]
        elif lower.startswith("tag:artist="):
            artist = line.split("=", 1)[1]
        elif lower.startswith("tag:album="):
            album = line.split("=", 1)[1]

    if not title:
        base = audio_path.stem.replace("_432Hz_Ambiophonique", "")
        base = base.replace("_432Hz_Remastered", "").replace("_Remastered", "")
        base = base.replace("_440Hz", "")
        if " - " in base:
            parts = base.split(" - ", 1)
            artist = parts[0].strip()
            title = parts[1].strip()
        else:
            title = base.strip()
            artist = "THIRTY3"

    if not artist:
        artist = "THIRTY3"

    return clean_filename(title), clean_filename(artist), album


def is_already_432hz(file_path: Path) -> bool:
    stem_lower = file_path.stem.lower()
    path_lower = str(file_path).lower()
    if "432hz" in stem_lower or "432 hz" in stem_lower:
        return True
    if "\\432 hz\\" in path_lower or "/432 hz/" in path_lower:
        return True
    return False


def process_audio(
    input_file: Path,
    output_dir: Path,
    target_lufs: float = -14.0,
    true_peak: float = -1.0,
    already_432: bool = False,
    force: bool = False
) -> Path | None:
    if not input_file.exists():
        print(f"[!] Fichier introuvable : {input_file}", file=sys.stderr)
        return None

    title, artist, album = get_metadata(input_file)
    output_name = f"{artist} - {title}_432Hz_Ambiophonique.mp3"
    target_file = output_dir / output_name

    if target_file.exists() and not force and target_file.stat().st_size > 100000:
        print(f"[*] Déjà existant et valide : {target_file.name}")
        return target_file

    output_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        cover_path = extract_cover_art(input_file, temp_dir)

        # Choix du filtre : si déjà à 432 Hz, pas de double pitch-shift
        needs_pitch = not (already_432 or is_already_432hz(input_file))
        dsp_filter = DSP_FULL_432_AMBIOPHONIC if needs_pitch else DSP_SPATIAL_ONLY

        mode_str = "Transposition 432 Hz + Ambiophonie 3D" if needs_pitch else "Ambiophonie 3D (Déjà 432 Hz)"
        print(f"[*] Traitement [{mode_str}] : {input_file.name}")

        dsp_out = temp_dir / "dsp.wav"
        cmd_dsp = [
            "ffmpeg", "-y", "-i", str(input_file),
            "-af", dsp_filter,
            "-ar", "48000", "-ac", "2",
            str(dsp_out)
        ]
        res_dsp = subprocess.run(cmd_dsp, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if res_dsp.returncode != 0:
            print(f"[!] Erreur DSP sur {input_file.name}:\n{res_dsp.stderr}", file=sys.stderr)
            return None

        # EBU R128 Passe 1 : Mesure
        cmd_m = [
            "ffmpeg", "-y", "-i", str(dsp_out),
            "-af", f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:print_format=json",
            "-f", "null", "-"
        ]
        res_m = subprocess.run(cmd_m, capture_output=True, text=True, encoding="utf-8", errors="replace")

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
            pass

        # EBU R128 Passe 2 : Normalisation
        norm_out = temp_dir / "norm.wav"
        loudnorm_str = (
            f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:"
            f"measured_I={measured_i}:measured_TP={measured_tp}:"
            f"measured_LRA={measured_lra}:measured_thresh={measured_thresh}:"
            f"offset={offset}:linear=true"
        )
        cmd_norm = [
            "ffmpeg", "-y", "-i", str(dsp_out),
            "-af", loudnorm_str,
            "-ar", "48000", "-ac", "2",
            str(norm_out)
        ]
        subprocess.run(cmd_norm, capture_output=True)

        # Encodage MP3 320k + Tag ID3v2
        cmd_final = ["ffmpeg", "-y", "-i", str(norm_out)]
        if cover_path and cover_path.exists():
            cmd_final.extend(["-i", str(cover_path), "-map", "0:a", "-map", "1:v", "-c:v", "copy", "-id3v2_version", "3"])
        else:
            cmd_final.extend(["-id3v2_version", "3"])

        cmd_final.extend([
            "-c:a", "libmp3lame", "-b:a", "320k",
            "-metadata", f"title={title}",
            "-metadata", f"artist={artist}",
            "-metadata", f"album={album if album else 'THIRTY3 432Hz Ambiophonique'}",
            "-metadata", "comment=THIRTY3 432Hz Verdi + Ambiophonic 3D Holographic + EBU R128",
            str(target_file)
        ])
        res_final = subprocess.run(cmd_final, capture_output=True)
        if res_final.returncode != 0:
            print(f"[!] Erreur d'encodage MP3 sur {input_file.name}", file=sys.stderr)
            return None

        # Synchronisation permanente vers C:\Users\th3th\Music\thirty3\432 hz ambiophonique\[Artist]\
        artist_dir = DEFAULT_AMBIOPHONIC_DIR / artist
        artist_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(target_file, artist_dir / target_file.name)

        print(f"[+] Succès : {target_file.name} ({target_file.stat().st_size / (1024*1024):.2f} Mo)")
        return target_file


def cmd_convert(args):
    input_path = Path(args.input)
    out_dir = Path(args.output_dir) if args.output_dir else DEFAULT_AMBIOPHONIC_DIR
    res = process_audio(
        input_path,
        out_dir,
        target_lufs=args.target_lufs,
        true_peak=args.true_peak,
        already_432=args.already_432,
        force=args.force
    )
    if res:
        print(f"[+] Fichier prêt à l'écoute : {res}")
        sys.exit(0)
    else:
        sys.exit(1)


def cmd_batch(args):
    input_dir = Path(args.input_dir)
    out_dir = Path(args.output_dir) if args.output_dir else DEFAULT_AMBIOPHONIC_DIR

    if not input_dir.exists():
        print(f"[!] Répertoire introuvable : {input_dir}", file=sys.stderr)
        sys.exit(1)

    extensions = [".mp3", ".wav", ".flac", ".m4a", ".ogg"]
    files = [p for p in input_dir.rglob("*") if p.is_file() and p.suffix.lower() in extensions]
    # Ignorer le dossier cible s'il est contenu dans input_dir
    files = [p for p in files if "432 hz ambiophonique" not in str(p).lower()]

    if args.max_files:
        files = files[:args.max_files]

    total = len(files)
    print(f"[*] {total} fichier(s) audio détecté(s) pour traitement batch.")

    success_count = 0
    for idx, f in enumerate(files, 1):
        print(f"\n--- [{idx}/{total}] {f.name} ---")
        res = process_audio(
            f,
            out_dir,
            target_lufs=args.target_lufs,
            true_peak=args.true_peak,
            already_432=args.already_432,
            force=args.force
        )
        if res:
            success_count += 1

    print(f"\n[+] Traitement batch terminé : {success_count}/{total} fichier(s) transmuté(s) avec succès.")
    sys.exit(0 if success_count == total else 1)


def cmd_verify(args):
    target = Path(args.input)
    if not target.exists():
        print(f"[!] Cible introuvable : {target}", file=sys.stderr)
        sys.exit(1)

    files = [target] if target.is_file() else [p for p in target.rglob("*.mp3") if p.is_file()]
    print(f"[*] Audit de sonie & conformité sur {len(files)} fichier(s) :")

    for f in files:
        cmd = [
            "ffmpeg", "-i", str(f),
            "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json",
            "-f", "null", "-"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        try:
            json_str = res.stderr[res.stderr.rfind("{"):res.stderr.rfind("}") + 1]
            data = json.loads(json_str)
            i = data.get("input_i", "N/A")
            tp = data.get("input_tp", "N/A")
            lra = data.get("input_lra", "N/A")
            print(f"  • {f.name} -> Sonie : {i} LUFS | True Peak : {tp} dBTP | LRA : {lra}")
        except Exception:
            print(f"  • {f.name} -> Analyse brute incomplète.")


def main():
    parser = argparse.ArgumentParser(
        description="THIRTY3 432 Hz Ambiophonique Transducer (Fichiers locaux & Traitement Batch)"
    )
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # convert
    p_conv = subparsers.add_parser("convert", help="Transmue un fichier audio unitaire en 432 Hz Ambiophonique")
    p_conv.add_argument("--input", required=True, help="Chemin du fichier audio source (MP3, WAV, FLAC, M4A)")
    p_conv.add_argument("--output-dir", default=str(DEFAULT_AMBIOPHONIC_DIR), help="Dossier de sortie")
    p_conv.add_argument("--target-lufs", type=float, default=-14.0, help="Cible LUFS (défaut: -14.0)")
    p_conv.add_argument("--true-peak", type=float, default=-1.0, help="Plafond True Peak (défaut: -1.0)")
    p_conv.add_argument("--already-432", action="store_true", help="Indique si le fichier est déjà à 432 Hz")
    p_conv.add_argument("--force", action="store_true", help="Force la régénération si le fichier existe")
    p_conv.set_defaults(func=cmd_convert)

    # batch
    p_batch = subparsers.add_parser("batch", help="Scanne un dossier et convertit tous les fichiers en lot")
    p_batch.add_argument("--input-dir", default=str(PERMANENT_DIR), help="Dossier racine à scanner")
    p_batch.add_argument("--output-dir", default=str(DEFAULT_AMBIOPHONIC_DIR), help="Dossier de sortie")
    p_batch.add_argument("--target-lufs", type=float, default=-14.0, help="Cible LUFS (défaut: -14.0)")
    p_batch.add_argument("--true-peak", type=float, default=-1.0, help="Plafond True Peak (défaut: -1.0)")
    p_batch.add_argument("--already-432", action="store_true", help="Ne pas réappliquer le pitch-shift si détecté")
    p_batch.add_argument("--force", action="store_true", help="Force la régénération")
    p_batch.add_argument("--max-files", type=int, default=None, help="Nombre maximal de fichiers à traiter")
    p_batch.set_defaults(func=cmd_batch)

    # verify
    p_ver = subparsers.add_parser("verify", help="Audit de sonie et conformité EBU R128")
    p_ver.add_argument("--input", required=True, help="Fichier ou dossier à vérifier")
    p_ver.set_defaults(func=cmd_verify)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
