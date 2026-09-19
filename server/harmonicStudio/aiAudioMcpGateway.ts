/**
 * server/harmonicStudio/aiAudioMcpGateway.ts
 * Passerelle d'orchestration pour les serveurs MCP Audio Pro dans HARMONIC STUDIO :
 * - YuE Foundation Model (Génération complète de chansons)
 * - BS-RoFormer (Séparation de sources & Stem Mastering)
 * - ACE-Step 1.5 (Composition steerable pas-à-pas)
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface McpToolDefinition {
  name: string;
  server: 'mcp-yue' | 'mcp-bs-roformer' | 'mcp-ace-step';
  description: string;
  category: 'generation' | 'mastering' | 'composition';
  inputSchema: any;
}

export interface McpExecutionResult {
  status: 'success' | 'error';
  toolName: string;
  server: string;
  durationMs: number;
  output: any;
  error?: string;
}

// Emplacements canoniques des scripts serveurs MCP
const MCP_SERVERS_CONFIG = {
  'mcp-yue': {
    scriptPath: path.join(process.cwd(), 'mcp-servers', 'yue', 'mcp_yue_server.py'),
    name: 'YuE Foundation Model',
    version: '1.5.0'
  },
  'mcp-bs-roformer': {
    scriptPath: path.join(process.cwd(), 'mcp-servers', 'bs-roformer', 'mcp_roformer_server.py'),
    name: 'BS-RoFormer BandSplit Engine',
    version: '2.1.0'
  },
  'mcp-ace-step': {
    scriptPath: path.join(process.cwd(), 'mcp-servers', 'ace-step', 'mcp_acestep_server.py'),
    name: 'ACE-Step 1.5 Steerable Engine',
    version: '1.5.0'
  }
};

/**
 * Exécute un appel d'outil MCP via stdio JSON-RPC 2.0 vers le script Python sous uv.
 */
export async function executeMcpTool(
  serverKey: 'mcp-yue' | 'mcp-bs-roformer' | 'mcp-ace-step',
  toolName: string,
  args: Record<string, any>
): Promise<McpExecutionResult> {
  const startTime = Date.now();
  const serverCfg = MCP_SERVERS_CONFIG[serverKey];

  if (!serverCfg || !fs.existsSync(serverCfg.scriptPath)) {
    return {
      status: 'error',
      toolName,
      server: serverKey,
      durationMs: Date.now() - startTime,
      output: null,
      error: `Le script du serveur MCP ${serverKey} est introuvable à l'emplacement : ${serverCfg?.scriptPath}`
    };
  }

  return new Promise((resolve) => {
    const hasUv = fs.existsSync('/root/.cargo/bin/uv') || fs.existsSync('/usr/local/bin/uv') || fs.existsSync('/usr/bin/uv');
    const execCmd = hasUv ? 'uv' : (process.env.PYTHON_BIN || 'python3');
    const execArgs = hasUv ? ['run', serverCfg.scriptPath] : [serverCfg.scriptPath];

    const child = spawn(execCmd, execArgs, {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    child.on('error', (err) => {
      resolve({
        status: 'error',
        toolName,
        server: serverKey,
        durationMs: Date.now() - startTime,
        output: null,
        error: `Échec du lancement du processus MCP : ${err.message}`
      });
    });

    child.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      if (code !== 0 && !stdoutData) {
        return resolve({
          status: 'error',
          toolName,
          server: serverKey,
          durationMs,
          output: null,
          error: `Processus terminé avec code ${code} : ${stderrData}`
        });
      }

      // Analyse des lignes JSON-RPC reçues
      const lines = stdoutData.split('\n').filter((l) => l.trim().length > 0);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === 1 && parsed.result) {
            const content = parsed.result.content?.[0]?.text;
            const parsedContent = content ? JSON.parse(content) : parsed.result;
            return resolve({
              status: 'success',
              toolName,
              server: serverKey,
              durationMs,
              output: parsedContent
            });
          }
        } catch {
          // Continuer l'analyse des lignes
        }
      }

      // Si le format n'est pas enveloppé, parser brut
      try {
        const rawJson = JSON.parse(stdoutData.trim());
        resolve({
          status: 'success',
          toolName,
          server: serverKey,
          durationMs,
          output: rawJson
        });
      } catch {
        resolve({
          status: 'error',
          toolName,
          server: serverKey,
          durationMs,
          output: null,
          error: `Réponse JSON invalide du serveur MCP : ${stdoutData || stderrData}`
        });
      }
    });

    // Envoi de la requête JSON-RPC 2.0 standard
    const rpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    child.stdin.write(JSON.stringify(rpcRequest) + '\n');
    child.stdin.end();
  });
}

/**
 * Retourne le catalogue des outils MCP audio disponibles.
 */
export function getAvailableAudioMcpTools(): McpToolDefinition[] {
  return [
    {
      name: 'yue_generate_full_song',
      server: 'mcp-yue',
      description: 'Génération de chanson complète bout-en-bout (voix + accompagnement) avec YuE Foundation Model et réaccordage 432 Hz',
      category: 'generation',
      inputSchema: {
        type: 'object',
        properties: {
          lyrics: { type: 'string', description: 'Paroles structurées [Verse], [Chorus]' },
          genre_prompt: { type: 'string', description: 'Style musical (rock, synthwave, ambient)' },
          duration_seconds: { type: 'number', description: 'Durée en secondes' },
          apply_432hz: { type: 'boolean', description: 'Réaccordage naturel 432 Hz' }
        },
        required: ['lyrics', 'genre_prompt']
      }
    },
    {
      name: 'yue_extend_track',
      server: 'mcp-yue',
      description: 'Prolonge une chanson ou section musicale existante générée par YuE',
      category: 'generation',
      inputSchema: {
        type: 'object',
        properties: {
          audio_path: { type: 'string', description: 'Chemin du fichier source' },
          extend_seconds: { type: 'number', description: 'Secondes à ajouter' }
        },
        required: ['audio_path']
      }
    },
    {
      name: 'roformer_separate_stems',
      server: 'mcp-bs-roformer',
      description: 'Sépare une piste audio en 4 stems (Vocals, Drums, Bass, Other) via BS-RoFormer',
      category: 'mastering',
      inputSchema: {
        type: 'object',
        properties: {
          audio_path: { type: 'string', description: 'Fichier audio à démixer' },
          stems: { type: 'array', items: { type: 'string' } },
          apply_432hz: { type: 'boolean' }
        },
        required: ['audio_path']
      }
    },
    {
      name: 'roformer_isolate_vocals',
      server: 'mcp-bs-roformer',
      description: 'Extraction chirurgicale d acapella pure sans repisse et de l instrumental résiduel',
      category: 'mastering',
      inputSchema: {
        type: 'object',
        properties: {
          audio_path: { type: 'string' },
          debleed_strength: { type: 'number' },
          apply_432hz: { type: 'boolean' }
        },
        required: ['audio_path']
      }
    },
    {
      name: 'roformer_stem_master',
      server: 'mcp-bs-roformer',
      description: 'Console de mastérisation dynamique par stems avec sommation certifiée EBU R128 (-14 LUFS)',
      category: 'mastering',
      inputSchema: {
        type: 'object',
        properties: {
          vocal_enhancement: { type: 'string' },
          bass_glue: { type: 'boolean' },
          drum_punch_db: { type: 'number' },
          apply_432hz: { type: 'boolean' },
          apply_phi_binaural: { type: 'boolean' }
        }
      }
    },
    {
      name: 'acestep_steerable_composition',
      server: 'mcp-ace-step',
      description: 'Composition musicale dirigée pas-à-pas (grille d accords, tempo, tonalité) via ACE-Step 1.5',
      category: 'composition',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          chord_progression: { type: 'string' },
          tempo_bpm: { type: 'number' },
          duration_seconds: { type: 'number' },
          apply_432hz: { type: 'boolean' }
        },
        required: ['prompt']
      }
    },
    {
      name: 'acestep_melodic_condition',
      server: 'mcp-ace-step',
      description: 'Conditionnement harmonique et variation de timbre d instrument',
      category: 'composition',
      inputSchema: {
        type: 'object',
        properties: {
          target_timbre: { type: 'string' },
          variation_strength: { type: 'number' },
          apply_432hz: { type: 'boolean' }
        }
      }
    },
    {
      name: 'acestep_multi_track_arrange',
      server: 'mcp-ace-step',
      description: 'Orchestration d arrangement multi-pistes studio (drums, bass, pads, strings)',
      category: 'composition',
      inputSchema: {
        type: 'object',
        properties: {
          arrangement_style: { type: 'string' },
          instrument_layers: { type: 'array', items: { type: 'string' } },
          apply_432hz: { type: 'boolean' }
        }
      }
    }
  ];
}
