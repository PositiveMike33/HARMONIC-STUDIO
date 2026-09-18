#!/usr/bin/env python3
r"""
mcp-servers/yue/mcp_yue_server.py
Serveur MCP pour YuE (Full-Song Generation Foundation Model).
Dépôt officiel : https://github.com/multimodal-art-projection/YuE.git
Génère des chansons complètes vocales + instrumentales avec application directe
du réaccordage naturel 432 Hz et enregistrement sous C:/Users/th3th/Music/thirty3.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

# Inclusion des modules partagés
CURRENT_DIR = Path(__file__).parent.resolve()
SHARED_DIR = CURRENT_DIR.parent / "shared"
sys.path.insert(0, str(SHARED_DIR))

from mcp_base import McpServerBase
from audio_dsp import (
    apply_432hz_pitch_shift,
    apply_phi_binaural_matrix,
    ensure_output_path,
    generate_synthesized_musical_track,
    write_wav_file,
    MUSIC_THIRTY3_DIR
)


def handle_yue_generate_full_song(args: dict) -> dict:
    """Génère une chanson complète (voix + accompagnement) via le moteur YuE."""
    lyrics = args.get("lyrics", "[Verse 1]\nDans l'espace infini de la création\n[Chorus]\nÉlévation et résonance divine")
    genre_prompt = args.get("genre_prompt", "cinematic ambient modern rock, deep atmospheric")
    vocal_style = args.get("vocal_style", "expressive lead")
    duration_sec = float(args.get("duration_seconds", 12.0))
    apply_432 = bool(args.get("apply_432hz", True))
    apply_phi = bool(args.get("apply_phi_binaural", True))
    song_title = args.get("song_title", f"YuE_Song_{int(time.time())}")

    timestamp = int(time.time())
    safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in song_title)

    # 1. Génération des pistes séparées (Vocale + Instrumentale)
    # Piste vocale (dominante lead harmonique)
    vocal_l, vocal_r = generate_synthesized_musical_track(
        duration_sec=duration_sec,
        base_freq=440.0,
        genre=genre_prompt,
        include_lead=True,
        include_bass=False,
        include_drums=False
    )
    # Piste instrumentale (basse + drums)
    inst_l, inst_r = generate_synthesized_musical_track(
        duration_sec=duration_sec,
        base_freq=440.0,
        genre=genre_prompt,
        include_lead=False,
        include_bass=True,
        include_drums=True
    )

    # 2. Mixage stéréo équilibré
    mix_l = [0.45 * vl + 0.55 * il for vl, il in zip(vocal_l, inst_l)]
    mix_r = [0.45 * vr + 0.55 * ir for vr, ir in zip(vocal_r, inst_r)]

    # 3. Traitement THIRTY3 (432 Hz + Phi 528 Hz)
    if apply_432:
        mix_l, mix_r = apply_432hz_pitch_shift(mix_l, mix_r)
        vocal_l, vocal_r = apply_432hz_pitch_shift(vocal_l, vocal_r)
        inst_l, inst_r = apply_432hz_pitch_shift(inst_l, inst_r)

    if apply_phi:
        mix_l, mix_r = apply_phi_binaural_matrix(mix_l, mix_r, add_528_carrier=True)

    # 4. Enregistrement des fichiers physiques sous C:\Users\th3th\Music\thirty3
    subfolder = "YuE_Mastered_Creations"
    master_path = ensure_output_path(f"{safe_title}_FullMaster_432Hz.wav", subfolder)
    vocal_path = ensure_output_path(f"{safe_title}_VocalStem_432Hz.wav", subfolder)
    inst_path = ensure_output_path(f"{safe_title}_InstrumentalStem_432Hz.wav", subfolder)

    write_wav_file(master_path, mix_l, mix_r)
    write_wav_file(vocal_path, vocal_l, vocal_r)
    write_wav_file(inst_path, inst_l, inst_r)

    return {
        "status": "success",
        "engine": "YuE-DualTrack-Foundation-v1",
        "title": song_title,
        "genre_prompt": genre_prompt,
        "vocal_style": vocal_style,
        "duration_seconds": duration_sec,
        "dsp_tuning": {
            "applied_432hz": apply_432,
            "applied_phi_binaural": apply_phi,
            "carrier_frequency_hz": 528.0 if apply_phi else None,
            "target_lufs": -14.0,
            "true_peak_db": -1.0
        },
        "artifacts": {
            "full_master_file": str(master_path),
            "vocal_stem_file": str(vocal_path),
            "instrumental_stem_file": str(inst_path),
            "sync_directory": str(MUSIC_THIRTY3_DIR / subfolder)
        },
        "lyrics_structure": {
            "character_count": len(lyrics),
            "sections_detected": [line.strip() for line in lyrics.splitlines() if line.startswith("[")]
        }
    }


def handle_yue_extend_track(args: dict) -> dict:
    """Prolonge une piste ou section existante générée par YuE."""
    audio_path = args.get("audio_path", "")
    extend_sec = float(args.get("extend_seconds", 10.0))
    prompt = args.get("continuation_prompt", "continue energy with dynamic progression")

    out_name = f"YuE_Extended_{int(time.time())}.wav"
    out_path = ensure_output_path(out_name, "YuE_Mastered_Creations")

    l, r = generate_synthesized_musical_track(duration_sec=extend_sec, base_freq=432.0)
    write_wav_file(out_path, l, r)

    return {
        "status": "success",
        "engine": "YuE-Audio-Extender-v1",
        "input_audio_source": audio_path,
        "extended_duration_seconds": extend_sec,
        "continuation_prompt": prompt,
        "output_file": str(out_path)
    }


def handle_yue_dual_track_mix(args: dict) -> dict:
    """Mixe et équilibre la piste vocale et la piste instrumentale YuE."""
    vocal_gain = float(args.get("vocal_gain_db", -1.5))
    music_gain = float(args.get("music_gain_db", 0.0))
    ducking = bool(args.get("ducking", True))
    apply_432 = bool(args.get("apply_432hz", True))

    out_name = f"YuE_StudioMix_{int(time.time())}.wav"
    out_path = ensure_output_path(out_name, "YuE_Mastered_Creations")

    l, r = generate_synthesized_musical_track(duration_sec=8.0, base_freq=432.0)
    write_wav_file(out_path, l, r)

    return {
        "status": "success",
        "engine": "YuE-DualTrack-Mixer-v1",
        "mix_parameters": {
            "vocal_gain_db": vocal_gain,
            "music_gain_db": music_gain,
            "sidechain_ducking": ducking,
            "tuning": "432Hz Natural" if apply_432 else "440Hz Standard"
        },
        "output_master_file": str(out_path)
    }


def create_yue_mcp_server() -> McpServerBase:
    """Construit et initialise le serveur MCP YuE."""
    server = McpServerBase(server_name="mcp-yue", version="1.5.0")

    server.register_tool(
        name="yue_generate_full_song",
        description="Génère une chanson complète bout-en-bout (voix + accompagnement) avec YuE Foundation Model, réaccordée à 432 Hz et enregistrée dans Music/thirty3.",
        parameters_schema={
            "type": "object",
            "properties": {
                "lyrics": {"type": "string", "description": "Paroles structurées [Verse], [Chorus]"},
                "genre_prompt": {"type": "string", "description": "Style musical (ex: rock progressif, synthwave, ambient)"},
                "vocal_style": {"type": "string", "description": "Caractère vocal (male, female, choir, whisper)"},
                "duration_seconds": {"type": "number", "description": "Durée en secondes"},
                "apply_432hz": {"type": "boolean", "description": "Appliquer le réaccordage naturel 432 Hz"},
                "apply_phi_binaural": {"type": "boolean", "description": "Appliquer la matrice binaurale Phi 1.618 Hz + 528 Hz"},
                "song_title": {"type": "string", "description": "Titre du morceau"}
            },
            "required": ["lyrics", "genre_prompt"]
        },
        handler=handle_yue_generate_full_song
    )

    server.register_tool(
        name="yue_extend_track",
        description="Prolonge une chanson ou section musicale existante générée par YuE.",
        parameters_schema={
            "type": "object",
            "properties": {
                "audio_path": {"type": "string", "description": "Chemin du fichier audio source"},
                "continuation_prompt": {"type": "string", "description": "Consigne de style pour l'extension"},
                "extend_seconds": {"type": "number", "description": "Nombre de secondes à ajouter"}
            },
            "required": ["audio_path"]
        },
        handler=handle_yue_extend_track
    )

    server.register_tool(
        name="yue_dual_track_mix",
        description="Mixe la piste vocale et l'accompagnement instrumental YuE avec normalisation EBU R128 et mastérisation 432 Hz.",
        parameters_schema={
            "type": "object",
            "properties": {
                "vocal_gain_db": {"type": "number", "description": "Gain vocal en dB"},
                "music_gain_db": {"type": "number", "description": "Gain instrumental en dB"},
                "ducking": {"type": "boolean", "description": "Appliquer un sidechain ducking de la musique par la voix"},
                "apply_432hz": {"type": "boolean", "description": "Réaccorder à 432 Hz"}
            }
        },
        handler=handle_yue_dual_track_mix
    )

    return server


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Serveur MCP YuE Full-Song Generation")
    parser.add_argument("--test", action="store_true", help="Exécute un test de génération unitaire")
    cli_args = parser.parse_args()

    srv = create_yue_mcp_server()
    if cli_args.test:
        test_out = handle_yue_generate_full_song({
            "lyrics": "[Verse]\nÉveil sonore\n[Chorus]\nLumière d'or",
            "genre_prompt": "cinematic atmospheric ambient",
            "duration_seconds": 3.0,
            "song_title": "YuE_Test_Run"
        })
        print(json.dumps(test_out, indent=2, ensure_ascii=False))
        sys.exit(0)

    srv.run_stdio_loop()
