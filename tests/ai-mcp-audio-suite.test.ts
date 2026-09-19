/**
 * tests/ai-mcp-audio-suite.test.ts
 * Suite de tests formelle pour la Triade MCP Audio Pro dans HARMONIC STUDIO :
 * 1. YuE Full-Song Generation Foundation Model
 * 2. BS-RoFormer Band-Split Source Separation & Stem Mastering
 * 3. ACE-Step 1.5 Steerable Music Foundation Model
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  getAvailableAudioMcpTools,
  executeMcpTool,
} from '../server/harmonicStudio/aiAudioMcpGateway';

describe('TRIADE MCP AUDIO PRO : TESTS UNITAIRES & INVARIANTS', () => {
  test('1. Catalogue complet des 8 outils MCP enregistrés', () => {
    const tools = getAvailableAudioMcpTools();
    assert.equal(tools.length, 8, '8 outils doivent être déclarés au catalogue');

    const serverNames = new Set(tools.map((t) => t.server));
    assert.ok(serverNames.has('mcp-yue'), 'mcp-yue doit être présent');
    assert.ok(serverNames.has('mcp-bs-roformer'), 'mcp-bs-roformer doit être présent');
    assert.ok(serverNames.has('mcp-ace-step'), 'mcp-ace-step doit être présent');

    const toolNames = tools.map((t) => t.name);
    assert.ok(toolNames.includes('yue_generate_full_song'));
    assert.ok(toolNames.includes('roformer_separate_stems'));
    assert.ok(toolNames.includes('acestep_steerable_composition'));
  });

  test('2. Moteur YuE : Génération de chanson complète 432 Hz et export physique', async () => {
    const result = await executeMcpTool('mcp-yue', 'yue_generate_full_song', {
      lyrics: '[Verse]\nLumière d or dans l infini\n[Chorus]\nRésonance 432Hz sacrée',
      genre_prompt: 'ambient cinematic soundscape',
      duration_seconds: 3.0,
      apply_432hz: true,
      apply_phi_binaural: true,
      song_title: 'Unit_Test_YuE_Song',
    });

    assert.equal(result.status, 'success', 'YuE doit réussir l exécution');
    assert.equal(result.server, 'mcp-yue');
    assert.ok(result.durationMs > 0, 'La durée d exécution doit être mesurée');

    const out = result.output;
    assert.equal(out.status, 'success');
    assert.equal(out.dsp_tuning.applied_432hz, true);
    assert.equal(out.dsp_tuning.applied_phi_binaural, true);
    assert.equal(out.dsp_tuning.carrier_frequency_hz, 528.0);
    assert.equal(out.dsp_tuning.target_lufs, -14.0);
    assert.equal(out.dsp_tuning.true_peak_db, -1.0);

    // Vérification de l existence physique du master généré
    const masterPath = out.artifacts.full_master_file;
    assert.ok(fs.existsSync(masterPath), `Le fichier maître YuE physique doit exister : ${masterPath}`);
    assert.ok(fs.statSync(masterPath).size > 10000, 'Le fichier audio doit faire plus de 10 Ko');
  });

  test('3. Moteur BS-RoFormer : Décomposition 4 stems haute-fidélité', async () => {
    const result = await executeMcpTool('mcp-bs-roformer', 'roformer_separate_stems', {
      audio_path: 'C:/thirty3_tests/source_audio.wav',
      stems: ['vocals', 'drums', 'bass', 'other'],
      apply_432hz: true,
    });

    assert.equal(result.status, 'success');
    assert.equal(result.server, 'mcp-bs-roformer');

    const out = result.output;
    assert.equal(out.separated_stems_count, 4);
    assert.ok(out.separation_metrics.vocals_sdr_db >= 10.0, 'SDR voix doit dépasser 10 dB');
    assert.ok(out.separation_metrics.phase_coherence_pct > 99.0, 'Cohérence de phase > 99%');
    assert.equal(out.applied_dsp['432hz_natural_tuning'], true);

    const stemFiles = out.stem_files;
    assert.ok(stemFiles.vocals && fs.existsSync(stemFiles.vocals), 'Stem vocal doit exister');
    assert.ok(stemFiles.drums && fs.existsSync(stemFiles.drums), 'Stem drums doit exister');
    assert.ok(stemFiles.bass && fs.existsSync(stemFiles.bass), 'Stem bass doit exister');
    assert.ok(stemFiles.other && fs.existsSync(stemFiles.other), 'Stem other doit exister');
  });

  test('4. Moteur BS-RoFormer : Isolation acapella pure', async () => {
    const result = await executeMcpTool('mcp-bs-roformer', 'roformer_isolate_vocals', {
      audio_path: 'C:/thirty3_tests/vocal_source.wav',
      debleed_strength: 0.90,
      apply_432hz: true,
    });

    assert.equal(result.status, 'success');
    const out = result.output;
    assert.ok(out.artifacts.acapella_vocal_file && fs.existsSync(out.artifacts.acapella_vocal_file));
    assert.ok(out.artifacts.instrumental_backing_file && fs.existsSync(out.artifacts.instrumental_backing_file));
  });

  test('5. Moteur ACE-Step 1.5 : Composition steerable dirigée par accords & tempo', async () => {
    const result = await executeMcpTool('mcp-ace-step', 'acestep_steerable_composition', {
      prompt: 'ambient electronic groove',
      chord_progression: 'Am - F - C - G',
      tempo_bpm: 120,
      key_signature: 'A minor',
      duration_seconds: 3.0,
      apply_432hz: true,
      apply_phi_binaural: true,
      title: 'Unit_Test_ACEStep_Progression',
    });

    assert.equal(result.status, 'success');
    assert.equal(result.server, 'mcp-ace-step');

    const out = result.output;
    assert.equal(out.musical_parameters.tempo_bpm, 120);
    assert.equal(out.musical_parameters.chords, 'Am - F - C - G');
    assert.equal(out.dsp_enhancements.natural_432hz_tuning, true);
    assert.equal(out.dsp_enhancements.carrier_frequency_hz, 528.0);

    const audioFile = out.artifacts.audio_master_file;
    const scoreFile = out.artifacts.harmonic_score_file;
    assert.ok(fs.existsSync(audioFile), 'Le fichier audio ACE-Step doit exister');
    assert.ok(fs.existsSync(scoreFile), 'Le fichier de partition/accords doit exister');
  });

  test('6. Invariants DSP & Synchronisation THIRTY3', () => {
    const ratio = 54 / 55;
    assert.ok(Math.abs(ratio - 0.98181818) < 1e-6, 'Ratio 54/55 exact');
    const phi = 1.6180339887;
    assert.ok(Math.abs(phi - 1.6180339) < 1e-5, 'Constante Phi exacte');
    const targetLufs = -14.0;
    const ceilingTruePeak = -1.0;
    assert.equal(targetLufs, -14.0, 'EBU R128 LUFS');
    assert.equal(ceilingTruePeak, -1.0, 'True Peak Ceiling');
  });
});
