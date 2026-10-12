#!/usr/bin/env python3
"""
transmute_lp_orchestral.py
==========================
Transmute chirurgicalement les titres uniques de Linkin Park vers :
C:\\Users\\th3th\\Music\\thirty3\\432 hz ambiophonique orchestral\\LINKIN PARK\\
Garantit l'absence de doublons et applique la chaîne complète EBU R128 + M/S 3D.
"""

import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(r"C:\Users\th3th\Music\thirty3")
SRC_DIR = ROOT / "432 hz ambiophonique" / "LINKIN PARK"
DST_DIR = ROOT / "432 hz ambiophonique orchestral" / "LINKIN PARK"
DST_DIR.mkdir(parents=True, exist_ok=True)

TRANSDUCER_SCRIPT = Path(r"C:\Users\th3th\HARMONIC-STUDIO\scripts\orchestral_ambiophonic_transducer.py")


def norm(name):
    stem = Path(name).stem
    stem = re.sub(r"_(432Hz|Phi|528Hz|Binaural|Ambiophonique|Orchestral|Remastered).*", "", stem, flags=re.I)
    stem = re.sub(r"^(Linkin Park\s*-\s*)?\d+\s*-\s*", "", stem, flags=re.I)
    return stem.strip().lower()


def main():
    existing_orch = {norm(f.name): f for f in DST_DIR.glob("*.mp3")}
    print(f"Titres déjà présents dans {DST_DIR.name} : {len(existing_orch)}")

    # Sélectionner les titres uniques à convertir
    unique_to_convert = {}
    for f in sorted(SRC_DIR.glob("*.mp3")):
        n = norm(f.name)
        if n not in existing_orch and n not in unique_to_convert:
            unique_to_convert[n] = f

    print(f"Nouveaux titres Linkin Park à transmuter : {len(unique_to_convert)}")

    success_count = 0
    start_t = time.time()

    for i, (n, src_file) in enumerate(unique_to_convert.items(), start=1):
        print(f"\n[{i}/{len(unique_to_convert)}] Transmutation de : {src_file.name}")
        cmd = [
            sys.executable,
            str(TRANSDUCER_SCRIPT),
            "convert",
            "--input", str(src_file),
            "--output-dir", str(ROOT / "432 hz ambiophonique orchestral"),
            "--already-432"
        ]

        t0 = time.time()
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        elapsed = time.time() - t0

        if res.returncode == 0:
            success_count += 1
            print(f"  ✔ [OK en {elapsed:.1f}s]")
            # Après succès certifié, supprimer l'ancienne version pour n'avoir qu'une seule version
            try:
                src_file.unlink()
                print(f"  ✔ Ancienne version retirée : {src_file.name}")
            except Exception as e:
                print(f"  [!] Avertissement unlink : {e}")
        else:
            print(f"  ✖ Erreur FFmpeg : {res.stderr[-200:]}")

    # Nettoyer les doublons résiduels Phi dans le dossier source
    for f in list(SRC_DIR.glob("*.mp3")):
        n = norm(f.name)
        if n in existing_orch or n in unique_to_convert:
            try:
                f.unlink()
                print(f"  ✔ Doublon retiré du dossier source : {f.name}")
            except Exception:
                pass

    total_time = time.time() - start_t
    print("\n=======================================================")
    print(f"Transmutation Linkin Park terminée en {total_time:.1f}s")
    print(f"Succès : {success_count} / {len(unique_to_convert)}")
    print(f"Total titres Linkin Park dans l'Orchestral Rayon : {len(list(DST_DIR.glob('*.mp3')))}")


if __name__ == "__main__":
    main()
