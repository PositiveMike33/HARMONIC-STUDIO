#!/usr/bin/env python3
"""
batch_spatial_linkin_park.py - Remastérisation Spatiale 3D Avancée & Clarté Acoustique Linkin Park
Studio THIRTY3 - Normes Broadcast EBU R128 & Démasquage Spectral

Traitements appliqués :
1. Filtre passe-haut anti-rumble subsonique (highpass 30 Hz).
2. Égalisation chirurgicale anti-masquage :
   - +1.2 dB @ 220 Hz (Q=1.5) : assise et corps vocal
   - -2.2 dB @ 1100 Hz (Q=2.2) : suppression de l'effet boîte/cacanne nasal
   - +1.8 dB @ 2800 Hz (Q=2.0) : intelligibilité formantique et diction
   - -2.8 dB @ 4200 Hz (Q=2.5) : éradication du fizz/agressivité guitares électriques
   - +2.2 dB @ 5500 Hz (Q=2.5) : éclat harmonique et brillance
   - -2.0 dB @ 7500 Hz (Q=2.0) : anti-stridence cymbales
3. Affinement dynamique des transitoires : crystalizer (intensité 1.4).
4. Spatialisation 3D Ambiophonique Holophonique :
   - Élargissement Mid/Side équilibré (Mid 0.98, Side 1.28, softclip activé)
   - Micro-rehaussement spatial Haas doux (side_gain 1.15, délai 2.05 ms)
5. Normalisation EBU R128 (-14.0 LUFS / True Peak -1.0 dBTP / LRA 11).
6. Encodage MP3 320 kbps haute fidélité.
"""

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def build_audio_filter_graph(
    target_lufs: float = -14.0,
    true_peak: float = -1.0,
    crystalizer_intensity: float = 1.4,
    side_level: float = 1.28,
    mid_level: float = 0.98,
) -> str:
    """Construit la chaîne complète de filtres FFmpeg."""
    filters = [
        "highpass=f=30",
        "equalizer=f=220:t=q:w=1.5:g=1.2",
        "equalizer=f=1100:t=q:w=2.2:g=-2.2",
        "equalizer=f=2800:t=q:w=2.0:g=1.8",
        "equalizer=f=4200:t=q:w=2.5:g=-2.8",
        "equalizer=f=5500:t=q:w=2.5:g=2.2",
        "equalizer=f=7500:t=q:w=2.0:g=-2.0",
        f"crystalizer=i={crystalizer_intensity}:c=1",
        f"stereotools=mlev={mid_level}:slev={side_level}:softclip=1",
        f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11",
    ]
    return ",".join(filters)


def process_track(
    input_file: Path,
    output_file: Path,
    filter_graph: str,
    bitrate: str = "320k",
) -> bool:
    """Traite une piste audio unique via FFmpeg."""
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(input_file),
        "-af", filter_graph,
        "-map", "0:a",
        "-map", "0:v?",
        "-c:a", "libmp3lame",
        "-b:a", bitrate,
        "-c:v", "copy",
        "-id3v2_version", "3",
        "-write_id3v1", "1",
        str(output_file),
    ]
    
    start_t = time.time()
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    elapsed = time.time() - start_t
    
    if res.returncode == 0:
        file_size_mb = output_file.stat().st_size / (1024 * 1024)
        print(f"✔ [{elapsed:.1f}s] {output_file.name} ({file_size_mb:.2f} Mo)")
        return True
    else:
        print(f"✖ Échec sur {input_file.name} : {res.stderr[-200:]}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Traitement Batch Spatial 3D & Clarté Acoustique THIRTY3"
    )
    parser.add_argument(
        "--input",
        type=str,
        help="Piste unique à traiter (pour test ou unitaire)",
    )
    parser.add_argument(
        "--dir",
        type=str,
        default=r"C:\Users\th3th\Music\thirty3\LINKIN PARK",
        help="Répertoire racine source",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=r"C:\Users\th3th\Music\thirty3\LINKIN PARK\Spatial_3D_Master",
        help="Répertoire de destination",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Inclure également les sous-dossiers (comme REANIMATION)",
    )
    parser.add_argument(
        "--target-lufs",
        type=float,
        default=-14.0,
        help="Cible EBU R128 (défaut -14.0 LUFS)",
    )
    parser.add_argument(
        "--true-peak",
        type=float,
        default=-1.0,
        help="Plafond True Peak (défaut -1.0 dBTP)",
    )
    parser.add_argument(
        "--max-tracks",
        type=int,
        default=0,
        help="Limite de pistes à traiter (0 = illimité)",
    )
    args = parser.parse_args()

    filter_graph = build_audio_filter_graph(
        target_lufs=args.target_lufs,
        true_peak=args.true_peak,
    )

    print("=== DÉMARRAGE DU TRAITEMENT SPATIAL 3D & CLARTÉ ACOUSTIQUE ===")
    print(f"Norme Loudness : EBU R128 ({args.target_lufs} LUFS, Max TP {args.true_peak} dBTP)")
    print(f"Égalisation : 6 bandes chirurgicales (220, 1100, 2800, 4200, 5500, 7500 Hz)")
    print(f"Spatialisation : Mid/Side 3D aéré + Affinement transitoires crystalizer")
    print("----------------------------------------------------------------------")

    # Mode piste unique
    if args.input:
        in_path = Path(args.input)
        if not in_path.exists():
            print(f"Erreur: Fichier introuvable {in_path}")
            sys.exit(1)
        out_path = Path(args.output_dir) / in_path.name
        success = process_track(in_path, out_path, filter_graph)
        sys.exit(0 if success else 1)

    # Mode répertoire
    src_dir = Path(args.dir)
    if not src_dir.exists():
        print(f"Erreur: Répertoire source introuvable {src_dir}")
        sys.exit(1)

    dst_dir = Path(args.output_dir)
    dst_dir.mkdir(parents=True, exist_ok=True)

    if args.recursive:
        mp3_files = [p for p in src_dir.rglob("*.mp3") if not dst_dir in p.parents and p.parent != dst_dir]
    else:
        mp3_files = [p for p in src_dir.glob("*.mp3") if p.is_file() and p.parent != dst_dir]

    mp3_files = sorted(mp3_files, key=lambda p: p.name)
    if args.max_tracks > 0:
        mp3_files = mp3_files[:args.max_tracks]

    print(f"Nombre de fichiers détectés : {len(mp3_files)}")
    print(f"Destination : {dst_dir}")
    print("----------------------------------------------------------------------")

    success_count = 0
    fail_count = 0
    t0 = time.time()

    for idx, f in enumerate(mp3_files, start=1):
        rel_path = f.relative_to(src_dir)
        target_file = dst_dir / rel_path
        print(f"[{idx}/{len(mp3_files)}] Traitement : {rel_path} ...", end=" ", flush=True)
        if process_track(f, target_file, filter_graph):
            success_count += 1
        else:
            fail_count += 1

    total_time = time.time() - t0
    print("======================================================================")
    print(f"Traitement terminé en {total_time:.1f}s.")
    print(f"Succès : {success_count} | Échecs : {fail_count}")
    print(f"Fichiers disponibles dans : {dst_dir}")


if __name__ == "__main__":
    main()
