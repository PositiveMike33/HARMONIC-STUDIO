#!/usr/bin/env python3
"""
transmute_all_library_orchestral.py
===================================
Transmutation intégrale et unifiée de toute la bibliothèque THIRTY3 vers :
C:\\Users\\th3th\\Music\\thirty3\\432 hz ambiophonique orchestral\\[Artiste]\\

Artistes ciblés :
- NORMANDIE
- NEVERTEL
- AWAKEN I AM
- LAMB OF GOD
- NICKELBACK
- ONE REPUBLIC
- DISTURBED
- $UICIDEBOY$
- STITCHES
- THIRTY3
- VEL94EV
- LINKIN PARK (Remix, Mashups, Acoustiques & Instrumentaux restants)

Pour chaque chanson :
1. Vérifie si le titre existe déjà dans le rayon orchestral.
2. Si non, applique la chaîne de mastering d'élite (EQ 6 bandes, crystalizer, M/S 3D, EBU R128 -14 LUFS / -1.0 dBTP).
3. Encode en MP3 320 kbps avec métadonnées ID3v2 et pochette intégrée.
4. Supprime la version obsolète/doublon dans les anciens répertoires.
5. Purge les dossiers vides une fois le transfert terminé.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
from collections import defaultdict
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(r"C:\Users\th3th\Music\thirty3")
ORCH_DIR = ROOT / "432 hz ambiophonique orchestral"
ORCH_DIR.mkdir(parents=True, exist_ok=True)


def normalize_title(path: Path) -> str:
    stem = path.stem
    stem = re.sub(r"_(440Hz|432Hz|Phi|528Hz|Binaural|Ambiophonique|Orchestral|Remastered|Guitar Boosted).*", "", stem, flags=re.I)
    stem = re.sub(r"\(Guitar Boosted[^)]*\)", "", stem, flags=re.I)
    stem = re.sub(r"^(Linkin Park\s*-\s*)?\d+\s*-\s*", "", stem, flags=re.I)
    stem = re.sub(r"\s*-\s*topic\s*", " ", stem, flags=re.I)
    return stem.strip().lower()


def determine_artist_folder(path: Path) -> str:
    pname = path.parent.name.upper()
    fname = path.name.lower()

    if "NORMANDIE" in pname or "normandie" in fname:
        return "NORMANDIE"
    if "NEVERTEL" in pname or "nevertel" in fname:
        return "NEVERTEL"
    if "AWAKEN I AM" in pname or "awaken i am" in fname:
        return "AWAKEN I AM"
    if "LAMB OF GOD" in pname or "lamb of god" in fname:
        return "LAMB OF GOD"
    if "NICKELBACK" in pname or "nickelback" in fname:
        return "NICKELBACK"
    if "ONEREPUBLIC" in pname or "one republic" in pname or "onerepublic" in fname:
        return "ONE REPUBLIC"
    if "DISTURBED" in pname or "disturbed" in fname:
        return "DISTURBED"
    if "SUICIDEBOY" in pname or "fighting demons" in fname:
        return "$UICIDEBOY$"
    if "STITCHES" in pname or "stitches" in fname:
        return "STITCHES"
    if "THIRTY3" in pname or "mikegg" in fname:
        return "THIRTY3"
    if "VEL94EV" in pname or "splintered self" in fname:
        return "VEL94EV"
    if any(k in fname or k in pname for k in ["linkin", "soldier", "eiro nareth", "hopeless wanderer", "in the end"]):
        return "LINKIN PARK"
    return path.parent.name


def is_already_432hz(file_path: Path) -> bool:
    name_lower = file_path.name.lower()
    return "432hz" in name_lower or "432 hz" in name_lower or "phi" in name_lower


def clean_base_name(stem: str) -> str:
    base = re.sub(r"_(440Hz|432Hz|Phi|528Hz|Binaural|Ambiophonique|Orchestral|Remastered).*", "", stem, flags=re.I)
    base = re.sub(r"\(Guitar Boosted[^)]*\)", "", base, flags=re.I)
    return base.strip()


def build_dsp_chain(already_432: bool) -> str:
    eq_chain = (
        "highpass=f=30,"
        "equalizer=f=220:t=q:w=1.5:g=1.2,"
        "equalizer=f=1100:t=q:w=2.2:g=-2.2,"
        "equalizer=f=2800:t=q:w=2.0:g=1.8,"
        "equalizer=f=4200:t=q:w=2.5:g=-2.8,"
        "equalizer=f=5500:t=q:w=2.5:g=2.2,"
        "equalizer=f=7500:t=q:w=2.0:g=-2.0,"
        "crystalizer=i=1.4:c=1,"
        "stereotools=mlev=0.98:slev=1.28:softclip=1,"
        "loudnorm=I=-14.0:TP=-1.0:LRA=11"
    )
    if not already_432:
        pitch_shift = "asetrate=48000*54/55,aresample=48000:resampler=soxr:precision=28,"
        return pitch_shift + eq_chain
    return eq_chain


def process_song(src_path: Path, target_dir: Path) -> bool:
    target_dir.mkdir(parents=True, exist_ok=True)
    base_name = clean_base_name(src_path.stem)
    out_filename = f"{base_name}_432Hz_Ambiophonique_Orchestral.mp3"
    target_file = target_dir / out_filename

    already_432 = is_already_432hz(src_path)
    dsp_chain = build_dsp_chain(already_432)

    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", str(src_path),
        "-af", dsp_chain,
        "-map", "0:a", "-map", "0:v?",
        "-c:a", "libmp3lame", "-b:a", "320k",
        "-c:v", "copy",
        "-id3v2_version", "3",
        str(target_file)
    ]

    t0 = time.time()
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    elapsed = time.time() - t0

    if res.returncode == 0 and target_file.exists() and target_file.stat().st_size > 500000:
        size_mb = target_file.stat().st_size / (1024 * 1024)
        print(f"  ✔ [OK en {elapsed:.1f}s] {target_file.name} ({size_mb:.2f} Mo)")
        return True
    else:
        print(f"  ✖ Erreur sur {src_path.name} : {res.stderr[-200:]}", file=sys.stderr)
        return False


def main():
    print("=== DÉMARRAGE DE LA TRANSMUTATION GLOBALE (TOUS GROUPES & CHANSONS) ===")
    print(f"Rayon cible : {ORCH_DIR}")

    # 1. Cartographier les titres déjà présents dans 432 hz ambiophonique orchestral
    existing_orch = {}
    for f in ORCH_DIR.rglob("*.mp3"):
        norm_t = normalize_title(f)
        existing_orch[norm_t] = f

    print(f"Titres déjà présents dans le rayon orchestral : {len(existing_orch)}")

    # 2. Identifier tous les fichiers audio sources hors rayon orchestral
    all_candidates = defaultdict(list)
    for p in ROOT.rglob("*.*"):
        if "HARMONIC-STUDIO-REPO" in p.parts or ORCH_DIR in p.parents or p.parent == ORCH_DIR:
            continue
        if p.is_file() and p.suffix.lower() in [".mp3", ".wav", ".flac"]:
            norm_t = normalize_title(p)
            all_candidates[norm_t].append(p)

    print(f"Chansons uniques trouvées hors rayon orchestral : {len(all_candidates)}")

    to_convert = {}
    obsolete_to_clean = []

    for norm_t, paths in all_candidates.items():
        if norm_t in existing_orch:
            # Cette chanson existe déjà dans le rayon orchestral -> marquer les versions obsolètes pour nettoyage
            obsolete_to_clean.extend(paths)
        else:
            # Sélectionner le meilleur fichier source (préférer 432Hz ou la plus grande taille)
            best_source = sorted(paths, key=lambda x: ("432hz" in x.name.lower(), x.stat().st_size), reverse=True)[0]
            target_artist = determine_artist_folder(best_source)
            to_convert[norm_t] = (best_source, target_artist, paths)

    print(f"Titres à transmuter vers l'Orchestral : {len(to_convert)}")
    print(f"Versions obsolètes à purger directement : {len(obsolete_to_clean)}")

    # Purge des versions déjà orphelines
    for f in obsolete_to_clean:
        try:
            f.unlink()
            print(f"  [DEL OBSOLETE] {f.relative_to(ROOT)}")
        except Exception:
            pass

    # Traitement par artiste
    success_count = 0
    fail_count = 0
    start_time = time.time()

    total_files = len(to_convert)
    for i, (norm_t, (src_file, target_artist, all_copies)) in enumerate(to_convert.items(), start=1):
        target_artist_dir = ORCH_DIR / target_artist
        print(f"\n[{i}/{total_files}] [{target_artist}] {src_file.name}")

        if process_song(src_file, target_artist_dir):
            success_count += 1
            # Supprimer toutes les anciennes copies de cette chanson
            for copy_path in all_copies:
                try:
                    if copy_path.exists():
                        copy_path.unlink()
                        print(f"  ✔ Source retirée : {copy_path.relative_to(ROOT)}")
                except Exception as e:
                    print(f"  [!] Avertissement suppression : {e}")
        else:
            fail_count += 1

    # Purge finale des dossiers vides
    print("\n[*] Purge des dossiers vides...")
    purged_dirs = 0
    for p in sorted(ROOT.rglob("*"), reverse=True):
        if "HARMONIC-STUDIO-REPO" in p.parts:
            continue
        if p.is_dir() and not any(p.iterdir()):
            p.rmdir()
            purged_dirs += 1
            print(f"  [RMDIR] {p.relative_to(ROOT)}")

    elapsed_total = time.time() - start_time
    print("\n=======================================================")
    print(f"Transmutation globale terminée en {elapsed_total:.1f}s")
    print(f"Succès : {success_count} | Échecs : {fail_count}")
    print(f"Dossiers vides purgés : {purged_dirs}")

    final_orch_count = len(list(ORCH_DIR.rglob("*.mp3")))
    print(f"Total final des titres dans 432 hz ambiophonique orchestral : {final_orch_count}")


if __name__ == "__main__":
    main()
