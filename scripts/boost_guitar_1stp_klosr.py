#!/usr/bin/env python3
"""
boost_guitar_1stp_klosr.py
==========================
Rehaussement acoustique chirurgical de la guitare électrique en arrière-plan
sur le pont de Linkin Park - 1Stp Klosr (3:35 à 4:18 / 215s à 258s).

Le riff originel de One Step Closer (guitare électrique accordée en Drop)
est spécifiquement amplifié en présence, corps et largeur stéréo sans dénaturer
les voix de Jonathan Davis et Chester Bennington au centre.
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

DEFAULT_INPUT = Path(r"C:\Users\th3th\.gemini\antigravity\brain\40dae8c5-9cb7-475e-bc7d-aa04135e9416\.user_uploaded\uploaded_media_1789936787987.mp3")


def main():
    parser = argparse.ArgumentParser(description="Rehausse la guitare de One Step Closer sur 1Stp Klosr")
    parser.add_argument("--input", type=str, default=str(DEFAULT_INPUT), help="Fichier source MP3")
    parser.add_argument("--start", type=float, default=215.0, help="Début du rehaussement en secondes (3:35 = 215.0)")
    parser.add_argument("--end", type=float, default=258.0, help="Fin du rehaussement en secondes (4:18 = 258.0)")
    parser.add_argument("--gain-attack", type=float, default=6.0, help="Gain sur l'attaque du riff à 1850 Hz (dB)")
    parser.add_argument("--gain-harmonics", type=float, default=5.5, help="Gain sur les harmoniques à 2650 Hz (dB)")
    parser.add_argument("--gain-body", type=float, default=4.5, help="Gain sur le corps de la guitare à 320 Hz (dB)")
    parser.add_argument("--side-level", type=float, default=1.80, help="Élargissement stéréo Side pendant le pont")
    args = parser.parse_args()

    in_file = Path(args.input)
    if not in_file.exists():
        print(f"[!] Fichier d'entrée introuvable : {in_file}", file=sys.stderr)
        sys.exit(1)

    t_start = args.start
    t_end = args.end
    cond = f"between(t,{t_start},{t_end})"

    # Chaîne de filtrage ciblée
    filters = [
        "volume=-1.5dB",
        f"equalizer=f=320:t=q:w=1.2:g={args.gain_body}:enable='{cond}'",
        f"equalizer=f=1850:t=q:w=1.5:g={args.gain_attack}:enable='{cond}'",
        f"equalizer=f=2650:t=q:w=1.8:g={args.gain_harmonics}:enable='{cond}'",
        f"equalizer=f=4200:t=q:w=2.0:g=3.0:enable='{cond}'",
        f"stereotools=mlev=0.96:slev={args.side_level}:enable='{cond}'",
        "loudnorm=I=-14.0:TP=-1.0:LRA=11"
    ]
    af_chain = ",".join(filters)

    temp_output = Path(r"C:\Users\th3th\HARMONIC-STUDIO\data\1Stp_Klosr_Guitar_Boosted.mp3")
    temp_output.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg", "-y",
        "-i", str(in_file),
        "-af", af_chain,
        "-map", "0:a", "-map", "0:v?",
        "-c:a", "libmp3lame", "-b:a", "320k",
        "-c:v", "copy",
        "-id3v2_version", "3",
        "-write_id3v1", "1",
        str(temp_output)
    ]

    print(f"[*] Traitement audio : {in_file.name}")
    print(f"[*] Plage de rehaussement : {t_start:.1f}s (3:35) -> {t_end:.1f}s (4:18)")
    print(f"[*] Paramètres guitare : Attaque 1850 Hz (+{args.gain_attack} dB), Harmoniques 2650 Hz (+{args.gain_harmonics} dB), Corps 320 Hz (+{args.gain_body} dB), Side={args.side_level}")

    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        print(f"[!] Échec FFmpeg :\n{res.stderr}", file=sys.stderr)
        sys.exit(1)

    print(f"[✔] Rendu principal achevé : {temp_output} ({temp_output.stat().st_size / (1024*1024):.2f} Mo)")

    # Déploiement multi-destinations
    destinations = [
        Path(r"C:\Users\th3th\Music\thirty3\LINKIN PARK\Spatial_3D_Master\REANIMATION\Linkin Park - 19 - 1Stp Klosr_432Hz_Ambiophonique_Orchestral.mp3"),
        Path(r"C:\Users\th3th\Music\thirty3\LINKIN PARK\Spatial_3D_Master\REANIMATION\Linkin Park - 19 - 1Stp Klosr (Guitar Boosted 3.35-4.18)_432Hz_Ambiophonique_Orchestral.mp3"),
        Path(r"C:\Users\th3th\Music\thirty3\432 hz ambiophonique orchestral\Linkin Park\Linkin Park - 19 - 1Stp Klosr_432Hz_Ambiophonique_Orchestral.mp3"),
        Path(r"C:\Users\th3th\Music\thirty3\432 hz ambiophonique orchestral\Linkin Park - 19 - 1Stp Klosr_432Hz_Ambiophonique_Orchestral.mp3"),
        Path(r"C:\Users\th3th\Music\thirty3\LINKIN PARK\REANIMATION\Linkin Park - 19 - 1Stp Klosr (Guitar Boosted 3.35-4.18)_432Hz_Ambiophonique_Orchestral.mp3"),
    ]

    print("\n[*] Synchronisation des versions remastérisées...")
    for dst in destinations:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(temp_output, dst)
        print(f"  ✔ Synchronisé : {dst}")

    print("\n[✔] Toutes les copies ont été mises à jour avec succès !")


if __name__ == "__main__":
    main()
