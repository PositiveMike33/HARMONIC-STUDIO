#!/usr/bin/env python3
"""
clean_exact_duplicates.py
=========================
Suppression rigoureuse des 110 doublons exacts (SHA-256 identiques) dans C:\\Users\\th3th\\Music\\thirty3.
Garantit la préservation absolue d'au moins une copie optimale (priorité au rayon 432 hz ambiophonique orchestral).
"""

import hashlib
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(r"C:\Users\th3th\Music\thirty3")
RECEIPT_FILE = Path(r"C:\Users\th3th\HARMONIC-STUDIO\data\deduplication_receipt.json")


def file_sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def score_path(p: Path) -> int:
    parts = p.relative_to(ROOT).parts
    # 1. Priorité absolue : 432 hz ambiophonique orchestral
    if "432 hz ambiophonique orchestral" in parts:
        return 100 - len(parts)  # Préférer les sous-dossiers par rapport à la racine
    # 2. Priorité 2 : 432 hz ambiophonique ou phi 432 hz 528 hz binaural
    if "432 hz ambiophonique" in parts or "phi 432 hz 528 hz binaural" in parts:
        return 50
    # 3. Priorité 3 : REANIMATION
    if "REANIMATION" in parts:
        return 40
    # 4. Dossiers à la racine : priorité minimale pour le nettoyage
    return 10


def main():
    print("=== DÉMARRAGE DU NETTOYAGE DES DOUBLONS EXACTS ===")
    print(f"Racine : {ROOT}")

    hash_map = defaultdict(list)
    total_audio = 0

    for p in ROOT.rglob("*.*"):
        if "HARMONIC-STUDIO-REPO" in p.parts:
            continue
        if p.is_file() and p.suffix.lower() in [".mp3", ".wav", ".flac", ".m4a"]:
            total_audio += 1
            h = file_sha256(p)
            hash_map[h].append(p)

    print(f"Fichiers audio audités : {total_audio}")
    duplicates_sets = {k: v for k, v in hash_map.items() if len(v) > 1}
    print(f"Ensembles de doublons détectés : {len(duplicates_sets)}")

    receipt = {
        "total_audited": total_audio,
        "duplicate_sets": len(duplicates_sets),
        "deleted_files": [],
        "retained_files": [],
        "freed_bytes": 0,
    }

    deleted_count = 0
    freed_bytes = 0

    for h, paths in duplicates_sets.items():
        # Trier par score décroissant : le premier est conservé, les autres sont supprimés
        sorted_paths = sorted(paths, key=score_path, reverse=True)
        kept = sorted_paths[0]
        to_del = sorted_paths[1:]

        receipt["retained_files"].append(str(kept.relative_to(ROOT)))

        for p in to_del:
            size = p.stat().st_size
            freed_bytes += size
            receipt["deleted_files"].append({
                "path": str(p.relative_to(ROOT)),
                "size_bytes": size,
                "sha256": h,
                "duplicate_of": str(kept.relative_to(ROOT)),
            })
            try:
                p.unlink()
                deleted_count += 1
                print(f"  [DEL] {p.relative_to(ROOT)} ({size / (1024*1024):.2f} Mo)")
            except Exception as e:
                print(f"  [ERR] Impossible de supprimer {p} : {e}", file=sys.stderr)

    receipt["freed_bytes"] = freed_bytes
    receipt["freed_mb"] = freed_bytes / (1024 * 1024)

    # Nettoyage des dossiers vides éventuels à la racine
    cleaned_dirs = 0
    for p in ROOT.iterdir():
        if p.is_dir() and "HARMONIC-STUDIO-REPO" not in p.parts and "432 hz" not in p.name.lower():
            # Si le dossier est vide
            if not any(p.iterdir()):
                p.rmdir()
                cleaned_dirs += 1
                print(f"  [RMDIR] Dossier vide supprimé : {p.name}")

    RECEIPT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(RECEIPT_FILE, "w", encoding="utf-8") as f:
        json.dump(receipt, f, indent=2, ensure_ascii=False)

    print("\n=======================================================")
    print(f"Nettoyage terminé avec succès !")
    print(f"Fichiers supprimés : {deleted_count}")
    print(f"Espace libéré : {freed_bytes / (1024*1024):.2f} Mo")
    print(f"Dossiers vides purgés : {cleaned_dirs}")
    print(f"Reçu d'audit scellé dans : {RECEIPT_FILE}")


if __name__ == "__main__":
    main()
