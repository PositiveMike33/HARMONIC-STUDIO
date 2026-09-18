import React, { useState } from 'react';
import {
  Wand2,
  Music,
  Sliders,
  Scissors,
  Layers,
  Sparkles,
  Download,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Radio,
  FileAudio,
  X,
  Volume2,
} from 'lucide-react';

interface AiAudioMasteringSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAudioMasteringSuiteModal: React.FC<AiAudioMasteringSuiteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'yue' | 'roformer' | 'acestep'>('yue');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State YuE
  const [yueLyrics, setYueLyrics] = useState(
    `[Verse 1]\nDans l'espace infini de la conscience pure\nLumière d'éveil sans peur ni blessure\n[Chorus]\nÉlévation 432Hz harmonique\nRésonance de l'Âme sacrée et quantique`
  );
  const [yueGenre, setYueGenre] = useState('cinematic progressive ambient rock, ethereal atmosphere');
  const [yueDuration, setYueDuration] = useState(15);
  const [yueApply432, setYueApply432] = useState(true);
  const [yueApplyPhi, setYueApplyPhi] = useState(true);

  // Form State BS-RoFormer
  const [roformerAudioSource, setRoformerAudioSource] = useState(
    'C:/Users/th3th/Music/thirty3/Nickelback/Nickelback - Bones For The Crows_440Hz.mp3'
  );
  const [roformerDebleed, setRoformerDebleed] = useState(0.85);
  const [roformerVocalProfile, setRoformerVocalProfile] = useState('clarity');
  const [roformerBassGlue, setRoformerBassGlue] = useState(true);

  // Form State ACE-Step 1.5
  const [acePrompt, setAcePrompt] = useState('steerable atmospheric synthwave with driving bassline');
  const [aceChords, setAceChords] = useState('Am - F - C - G');
  const [aceTempo, setAceTempo] = useState(124);
  const [aceKey, setAceKey] = useState('A minor');

  if (!isOpen) return null;

  // Lancement YuE Full-Song
  const handleRunYuE = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setLastResult(null);

    try {
      const res = await fetch('/api/mcp/yue/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: yueLyrics,
          genre_prompt: yueGenre,
          duration_seconds: Number(yueDuration),
          apply_432hz: yueApply432,
          apply_phi_binaural: yueApplyPhi,
          song_title: 'YuE_Studio_Creation',
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setLastResult(data.output || data);
      } else {
        setErrorMessage(data.error || 'Erreur lors de la génération avec YuE');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur de connexion au serveur MCP YuE');
    } finally {
      setIsProcessing(false);
    }
  };

  // Lancement BS-RoFormer
  const handleRunRoFormer = async (action: 'separate' | 'master' | 'vocal') => {
    setIsProcessing(true);
    setErrorMessage(null);
    setLastResult(null);

    try {
      const endpoint = action === 'separate' ? '/api/mcp/roformer/separate' : '/api/mcp/roformer/master';
      const body =
        action === 'separate'
          ? {
              audio_path: roformerAudioSource,
              stems: ['vocals', 'drums', 'bass', 'other'],
              apply_432hz: true,
            }
          : {
              vocal_enhancement: roformerVocalProfile,
              bass_glue: roformerBassGlue,
              drum_punch_db: 1.5,
              apply_432hz: true,
              apply_phi_binaural: true,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setLastResult(data.output || data);
      } else {
        setErrorMessage(data.error || 'Erreur lors du traitement BS-RoFormer');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur de connexion au serveur MCP BS-RoFormer');
    } finally {
      setIsProcessing(false);
    }
  };

  // Lancement ACE-Step 1.5
  const handleRunAceStep = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setLastResult(null);

    try {
      const res = await fetch('/api/mcp/acestep/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: acePrompt,
          chord_progression: aceChords,
          tempo_bpm: Number(aceTempo),
          key_signature: aceKey,
          duration_seconds: 12.0,
          apply_432hz: true,
          apply_phi_binaural: true,
          title: 'ACEStep_Studio_Piece',
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setLastResult(data.output || data);
      } else {
        setErrorMessage(data.error || 'Erreur lors de la composition ACE-Step');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur de connexion au serveur MCP ACE-Step');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Studio IA Pro — Triade MCP Audio
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono">
                  YuE • BS-RoFormer • ACE-Step
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Génération complète, séparation de sources, mastering par stems & accordage 432 Hz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('yue')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'yue'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            1. YuE (Génération Complète)
          </button>
          <button
            onClick={() => setActiveTab('roformer')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'roformer'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            2. BS-RoFormer (Stems & De-mixing)
          </button>
          <button
            onClick={() => setActiveTab('acestep')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'acestep'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            3. ACE-Step 1.5 (Composition Dirigée)
          </button>
        </div>

        {/* Corps modal scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: YuE */}
          {activeTab === 'yue' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-200/90 leading-relaxed">
                <strong>YuE Foundation Model :</strong> Génère des chansons complètes avec séparation
                automatique en pistes vocales et instrumentales, application de l'accordage naturel
                432 Hz et export permanent dans <code className="text-emerald-300">C:\Users\th3th\Music\thirty3</code>.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Paroles Structurées ([Verse], [Chorus])
                  </label>
                  <textarea
                    rows={6}
                    value={yueLyrics}
                    onChange={(e) => setYueLyrics(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Style & Ambiance Musicale (Genre Prompt)
                    </label>
                    <input
                      type="text"
                      value={yueGenre}
                      onChange={(e) => setYueGenre(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Durée : {yueDuration} secondes
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={yueDuration}
                      onChange={(e) => setYueDuration(Number(e.target.value))}
                      className="w-full accent-emerald-500 mt-1"
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={yueApply432}
                        onChange={(e) => setYueApply432(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      Réaccordage Naturel 432 Hz Verdi (Ratio 54/55)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={yueApplyPhi}
                        onChange={(e) => setYueApplyPhi(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      Modulation Binaurale Phi (1.618 Hz) + Porteuse Sacrée 528 Hz
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRunYuE}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Inférence YuE en cours (432Hz & DSP)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Générer la Chanson Complète avec YuE
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BS-RoFormer */}
          {activeTab === 'roformer' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-200/90 leading-relaxed">
                <strong>BS-RoFormer Band-Split :</strong> SOTA mondial pour la séparation de sources audio
                (SDR {'>'} 12.9 dB). Décompose les pistes en 4 stems (Voix, Batterie, Basse, Instruments) et
                permet un mastérisation dynamique par stems resommés.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Fichier Audio Source (Path local ou catalogue)
                  </label>
                  <input
                    type="text"
                    value={roformerAudioSource}
                    onChange={(e) => setRoformerAudioSource(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none mt-1 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Scissors className="w-4 h-4" /> 1. Dé-mixage 4 Stems
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Extraction instantanée : Vocals, Drums, Bass, Other à 432 Hz.
                    </p>
                    <button
                      onClick={() => handleRunRoFormer('separate')}
                      disabled={isProcessing}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition disabled:opacity-50"
                    >
                      Séparer les 4 Stems
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" /> 2. Stem Mastering Console
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Égalisation dynamique, compression de colle basse et sommation EBU R128 (-14 LUFS).
                    </p>
                    <button
                      onClick={() => handleRunRoFormer('master')}
                      disabled={isProcessing}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-xs font-semibold text-white transition disabled:opacity-50"
                    >
                      Mastériser par Stems
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACE-Step 1.5 */}
          {activeTab === 'acestep' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                <strong>ACE-Step 1.5 Steerable Foundation :</strong> Modèle de composition dirigée
                pas-à-pas permettant un contrôle total sur les progressions d'accords, le tempo BPM et
                la tonalité musicale avec transposition immédiate en 432 Hz.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Progression d'Accords
                    </label>
                    <input
                      type="text"
                      value={aceChords}
                      onChange={(e) => setAceChords(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none mt-1 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Ambiance & Direction Stylistique
                    </label>
                    <input
                      type="text"
                      value={acePrompt}
                      onChange={(e) => setAcePrompt(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Tempo : {aceTempo} BPM
                    </label>
                    <input
                      type="range"
                      min={60}
                      max={180}
                      value={aceTempo}
                      onChange={(e) => setAceTempo(Number(e.target.value))}
                      className="w-full accent-amber-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Tonalité
                    </label>
                    <select
                      value={aceKey}
                      onChange={(e) => setAceKey(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none mt-1"
                    >
                      <option value="A minor">A mineur (La naturel)</option>
                      <option value="C major">C majeur (Do)</option>
                      <option value="D dorian">D dorien</option>
                      <option value="E minor">E mineur (Mi)</option>
                      <option value="F major">F majeur (Fa 528Hz)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRunAceStep}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Composition ACE-Step en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Composer Pas-à-Pas avec ACE-Step 1.5
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Résultat & Télémétrie */}
          {lastResult && (
            <div className="p-4 bg-slate-950/80 border border-emerald-500/40 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Opération Réussie ({lastResult.engine || 'Moteur MCP'})
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Sync : C:\Users\th3th\Music\thirty3
                </span>
              </div>

              {lastResult.artifacts && (
                <div className="p-3 bg-slate-900 rounded-lg text-xs space-y-1.5 font-mono text-slate-300">
                  {Object.entries(lastResult.artifacts).map(([key, val]) => (
                    <div key={key} className="truncate">
                      <span className="text-emerald-400">{key}:</span> {String(val)}
                    </div>
                  ))}
                </div>
              )}

              {lastResult.stem_files && (
                <div className="p-3 bg-slate-900 rounded-lg text-xs space-y-1.5 font-mono text-slate-300">
                  {Object.entries(lastResult.stem_files).map(([stem, file]) => (
                    <div key={stem} className="truncate">
                      <span className="text-indigo-400">{stem}:</span> {String(file)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
