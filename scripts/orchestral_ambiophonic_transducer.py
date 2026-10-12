#!/usr/bin/env python3
"""
orchestral_ambiophonic_transducer.py
====================================
THIRTY3 Autonomous Audio Skill: thirty3-432hz-ambiophonic-orchestral

Commands:
- convert : Transmute a single local audio file (MP3, WAV, FLAC, M4A) to 432 Hz Ambiophonique Orchestral 3D.
- batch   : Recursively scan a library folder, detect 432 Hz masters vs 440 Hz tracks,
            and batch convert them into C:\\Users\\th3th\\Music\\thirty3\\432 hz ambiophonique orchestral\\.
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
DEFAULT_ORCHESTRAL_DIR = PERMANENT_DIR / "432 hz ambiophonique orchestral"

RATIO_432 = "0.98181818"  # 54/55

DSP_FULL_ORCHESTRAL = (
    "volume=-2.0dB,highpass=f=30,"
    f"rubberband=pitch={RATIO_432}:transients=smooth:detector=soft,"
    "aresample=96000:resampler=soxr:precision=33:osf=fltp,"
    "equalizer=f=220:t=q:w=1.5:g=1.2,"
    "equalizer=f=1100:t=q:w=2.2:g=-2.2,"
    "equalizer=f=2800:t=q:w=2.0:g=1.8,"
    "equalizer=f=4200:t=q:w=2.5:g=-2.8,"
    "equalizer=f=5500:t=q:w=2.5:g=2.2,"
    "equalizer=f=7500:t=q:w=2.0:g=-2.0,"
    "crystalizer=i=1.4:c=1,"
    "stereotools=mlev=0.98:slev=1.28:balance_in=0:softclip=1"
)

DSP_SPATIAL_ONLY = (
    "volume=-1.5dB,highpass=f=30,"
    "aresample=96000:resampler=soxr:precision=33:osf=fltp,"
    "equalizer=f=220:t=q:w=1.5:g=1.2,"
    "equalizer=f=1100:t=q:w=2.2:g=-2.2,"
    "equalizer=f=2800:t=q:w=2.0:g=1.8,"
    "equalizer=f=4200:t=q:w=2.5:g=-2.8,"
    "equalizer=f=5500:t=q:w=2.5:g=2.2,"
    "equalizer=f=7500:t=q:w=2.0:g=-2.0,"
    "crystalizer=i=1.4:c=1,"
    "stereotools=mlev=0.98:slev=1.28:balance_in=0:softclip=1"
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


def read_id3_metadata(audio_path: Path) -> dict:
    cmd = [
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_format", str(audio_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode == 0:
        try:
            data = json.loads(res.stdout)
            return data.get("format", {}).get("tags", {})
        except Exception:
            return {}
    return {}


def is_already_432hz(file_path: Path, tags: dict) -> bool:
    name = file_path.name.lower()
    path_str = str(file_path).lower()

    if any(k in name for k in ["432hz", "432 hz", "432_hz", "orchestral"]):
        return True
    if any(k in path_str for k in ["432 hz", "432hz", "orchestral"]):
        return True

    for val in tags.values():
        val_lower = str(val).lower()
        if "432hz" in val_lower or "432 hz" in val_lower or "verdi" in val_lower:
            return True

    return False


def measure_loudness(audio_path: Path, dsp_chain: str) -> dict:
    filter_desc = f"{dsp_chain},loudnorm=I=-14.0:TP=-1.0:LRA=11:print_format=json"
    cmd = [
        "ffmpeg", "-y", "-i", str(audio_path),
        "-af", filter_desc,
        "-f", "null", "-"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
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


def transmute_single(
    input_file: Path,
    output_dir: Path,
    target_lufs: float = -14.0,
    true_peak: float = -1.0,
    force_already_432: bool = False,
    force_overwrite: bool = False
) -> Path | None:
    if not input_file.exists():
        print(f"[!] Fichier introuvable : {input_file}", file=sys.stderr)
        return None

    tags = read_id3_metadata(input_file)
    artist = clean_filename(tags.get("artist") or tags.get("ARTIST") or "Unknown_Artist")
    title = clean_filename(tags.get("title") or tags.get("TITLE") or input_file.stem)

    already_432 = force_already_432 or is_already_432hz(input_file, tags)
    dsp_chain = DSP_SPATIAL_ONLY if already_432 else DSP_FULL_ORCHESTRAL

    mode_label = "Spatialisation Seule" if already_432 else "Transposition 432 Hz + Spatialisation"
    print(f"\n[*] Traitement : {input_file.name} [{mode_label}]")

    clean_base = re.sub(r"_(440Hz|432Hz|Phi_432Hz_528Hz_Binaural|Remastered|Orchestral).*", "", input_file.stem, flags=re.I)
    clean_base = clean_filename(clean_base)
    output_filename = f"{clean_base}_432Hz_Ambiophonique_Orchestral.mp3"

    artist_dir = output_dir / artist
    artist_dir.mkdir(parents=True, exist_ok=True)
    target_path = artist_dir / output_filename

    if target_path.exists() and not force_overwrite:
        print(f"  [i] Déjà existant : {target_path.name} (Ignoré, utilisez --force pour écraser)")
        return target_path

    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        cover_path = extract_cover_art(input_file, temp_dir)

        print("  [*] Passe 1/2 : Mesure EBU R128...")
        measured = measure_loudness(input_file, dsp_chain)

        loudnorm_p2 = (
            f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:"
            f"measured_I={measured.get('input_i', '-14.0')}:"
            f"measured_TP={measured.get('input_tp', '-1.0')}:"
            f"measured_LRA={measured.get('input_lra', '11.0')}:"
            f"measured_thresh={measured.get('input_thresh', '-24.0')}:"
            f"offset={measured.get('target_offset', '0.0')}:linear=true"
        )
        final_af = f"{dsp_chain},{loudnorm_p2}"

        temp_out = temp_dir / output_filename
        cmd = ["ffmpeg", "-y", "-i", str(input_file)]

        if cover_path:
            cmd.extend(["-i", str(cover_path)])

        cmd.extend(["-af", final_af, "-c:a", "libmp3lame", "-b:a", "320k"])

        if cover_path:
            cmd.extend([
                "-map", "0:a", "-map", "1:v",
                "-c:v", "copy",
                "-id3v2_version", "3",
                "-metadata:s:v", 'title="Album cover"',
                "-metadata:s:v", 'comment="Cover (front)"'
            ])
        else:
            cmd.extend(["-id3v2_version", "3"])

        new_title = f"{title} (432Hz Ambiophonique Orchestral)"
        cmd.extend([
            "-metadata", f"title={new_title}",
            "-metadata", f"artist={artist}",
            "-metadata", "album=432 Hz Ambiophonique Orchestral Studio",
            "-metadata", "genre=Symphonic Ambiophonic 432Hz",
            "-metadata", "comment=Remastérisé en 432 Hz Ambiophonique Orchestral (Verdi 54/55, M/S 3D, EBU R128)",
            str(temp_out)
        ])

        print("  [*] Passe 2/2 : Rendu 320 kbps & Injection ID3...")
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if res.returncode != 0:
            print(f"[!] Échec FFmpeg sur {input_file.name} :\n{res.stderr[-300:]}", file=sys.stderr)
            return None

        # Copie finale dans le sous-dossier de l'artiste
        shutil.copy2(temp_out, target_path)

        print(f"  [✔] Succès : {target_path}")
        return target_path


def cmd_convert(args):
    output_dir = Path(args.output_dir)
    transmute_single(
        input_file=Path(args.input),
        output_dir=output_dir,
        target_lufs=args.target_lufs,
        true_peak=args.true_peak,
        force_already_432=args.already_432,
        force_overwrite=args.force
    )


def cmd_batch(args):
    src_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    extensions = {".mp3", ".wav", ".flac", ".m4a", ".aac"}
    all_files = [
        p for p in src_dir.rglob("*")
        if p.suffix.lower() in extensions and output_dir not in p.parents and p.parent != output_dir
    ]

    print(f"=== BATCH TRANSDUCTION 432 HZ AMBIOPHONIQUE ORCHESTRAL ===")
    print(f"Dossier source : {src_dir}")
    print(f"Destination : {output_dir}")
    print(f"Fichiers audio trouvés : {len(all_files)}")

    if args.max_files:
        all_files = all_files[:args.max_files]
        print(f"Limitation active à {args.max_files} fichiers.")

    success = 0
    skipped = 0
    errors = 0

    for i, file_path in enumerate(all_files, start=1):
        print(f"\n--- [{i}/{len(all_files)}] ---")
        res = transmute_single(
            input_file=file_path,
            output_dir=output_dir,
            target_lufs=args.target_lufs,
            true_peak=args.true_peak,
            force_already_432=args.already_432,
            force_overwrite=args.force
        )
        if res:
            success += 1
        else:
            errors += 1

    print("\n==================================================")
    print(f"Batch terminé. Succès: {success} | Erreurs: {errors}")
    print(f"Destination : {output_dir}")


def cmd_verify(args):
    target = Path(args.input)
    if not target.exists():
        print(f"[!] Cible introuvable : {target}", file=sys.stderr)
        sys.exit(1)

    files = [target] if target.is_file() else list(target.rglob("*.mp3"))
    print(f"=== AUDIT DE CONFORMITÉ EBU R128 & SPATIAL ORCHESTRAL ({len(files)} fichiers) ===")

    for f in files:
        cmd = [
            "ffmpeg", "-i", str(f),
            "-af", "loudnorm=I=-14.0:TP=-1.0:LRA=11:print_format=json",
            "-f", "null", "-"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        lines = res.stderr.splitlines()
        json_lines = []
        rec = False
        for line in lines:
            if "{" in line:
                rec = True
            if rec:
                json_lines.append(line)
            if "}" in line and rec:
                break
        try:
            d = json.loads("\n".join(json_lines))
            i = float(d.get("input_i", -99))
            tp = float(d.get("input_tp", 99))
            status = "✔ CONFORME" if abs(i - (-14.0)) <= 1.0 and tp <= -0.9 else "⚠ DÉRIVE"
            print(f"[{status}] {f.name} -> I: {i:.1f} LUFS | TP: {tp:.2f} dBTP")
        except Exception:
            print(f"[?] {f.name} -> Erreur d'analyse")


def main():
    parser = argparse.ArgumentParser(
        description="Moteur de Transmutation 432 Hz Ambiophonique Orchestral THIRTY3"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Convert
    p_conv = subparsers.add_parser("convert", help="Transmute un fichier audio local unique")
    p_conv.add_argument("--input", required=True, help="Chemin du fichier audio source")
    p_conv.add_argument("--output-dir", default=str(DEFAULT_ORCHESTRAL_DIR), help="Dossier de sortie")
    p_conv.add_argument("--target-lufs", type=float, default=-14.0, help="Sonie cible LUFS (défaut -14.0)")
    p_conv.add_argument("--true-peak", type=float, default=-1.0, help="Plafond True Peak dBTP (défaut -1.0)")
    p_conv.add_argument("--already-432", action="store_true", help="Force le mode spatial sans pitch shift")
    p_conv.add_argument("--force", action="store_true", help="Écrase le fichier si existant")
    p_conv.set_defaults(func=cmd_convert)

    # Batch
    p_batch = subparsers.add_parser("batch", help="Transmute en lot un répertoire complet")
    p_batch.add_argument("--input-dir", default=str(PERMANENT_DIR), help="Répertoire source")
    p_batch.add_argument("--output-dir", default=str(DEFAULT_ORCHESTRAL_DIR), help="Dossier de sortie")
    p_batch.add_argument("--max-files", type=int, default=None, help="Limite du nombre de fichiers")
    p_batch.add_argument("--target-lufs", type=float, default=-14.0, help="Sonie cible LUFS (défaut -14.0)")
    p_batch.add_argument("--true-peak", type=float, default=-1.0, help="Plafond True Peak dBTP (défaut -1.0)")
    p_batch.add_argument("--already-432", action="store_true", help="Force le mode spatial sans pitch shift")
    p_batch.add_argument("--force", action="store_true", help="Écrase les fichiers existants")
    p_batch.set_defaults(func=cmd_batch)

    # Verify
    p_ver = subparsers.add_parser("verify", help="Audite la conformité EBU R128 d'un fichier ou dossier")
    p_ver.add_argument("--input", required=True, help="Fichier ou dossier à auditer")
    p_ver.set_defaults(func=cmd_verify)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
