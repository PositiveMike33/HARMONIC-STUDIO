# Architecture des Compétences Agentiques THIRTY3 : 432 Hz Ambiophonique Orchestral

Ce document définit l'architecture et les spécifications techniques pour les deux nouvelles compétences autonomes de remastérisation acoustique et de spatialisation 3D orchestrale.

## 1. Objectifs & Cadre d'Ingénierie

Créer deux compétences complémentaires conformes au standard Antigravity et aux protocoles THIRTY3 :
1. **`youtube-remaster-mp3-432hz-ambiophonic-orchestral`** : Extraction de flux YouTube, transposition Verdi 432 Hz, clarté vocale et instrumentale, spatialisation 3D orchestrale symphonique, normalisation broadcast EBU R128 et synchronisation permanente.
2. **`thirty3-432hz-ambiophonic-orchestral`** : Transmutation locale et batch de fichiers MP3/FLAC/WAV/M4A avec détection anti-double transposition, clarté chirurgicale, spatialisation orchestrale 3D et conservation des métadonnées et pochettes.

---

## 2. Décomposition en Tâches Atomiques ACP (Agent Context Protocol)

### Phase 1 : Spécification des Chaînes DSP Acoustiques Orchestrales
- **Tâche ACP task_001** : Conception du graphe de filtrage audio unifié (Anti-rumble 30 Hz, ratio Verdi 54/55 -31.766c, SOXR 96 kHz, égalisation 6 bandes anti-masquage, affineur dynamique de transitoires crystalizer i=1.4, élargisseur holophonique stereotools mlev=0.98 slev=1.28, normalisation EBU R128 -14 LUFS / -1 dBTP).
- **Tâche ACP task_002** : Définition des règles de synchronisation vers `C:\Users\th3th\Music\thirty3\432 hz ambiophonique orchestral\` et sous-dossiers artistes.

### Phase 2 : Développement de la Compétence YouTube (`youtube-remaster-mp3-432hz-ambiophonic-orchestral`)
- **Tâche ACP task_003** : Création du script CLI `scripts/remaster_432hz_ambiophonic_orchestral.py`.
- **Tâche ACP task_004** : Rédaction du document de gouvernance et guide `SKILL.md` avec frontmatter YAML conforme.
- **Tâche ACP task_005** : Validation unitaire des arguments CLI, extraction de métadonnées et validation de la chaîne FFmpeg.

### Phase 3 : Développement de la Compétence Fichiers Locaux & Batch (`thirty3-432hz-ambiophonic-orchestral`)
- **Tâche ACP task_006** : Création du script CLI `scripts/orchestral_ambiophonic_transducer.py` avec sous-commandes `convert`, `batch`, et `verify`.
- **Tâche ACP task_007** : Intégration de la détection intelligente anti-double pitch shift (détection 432 Hz dans métadonnées et nom de fichier).
- **Tâche ACP task_008** : Rédaction du document de gouvernance et guide `SKILL.md` avec frontmatter YAML conforme.

### Phase 4 : Déploiement et Vérification Formelle
- **Tâche ACP task_009** : Installation des deux skills dans `C:\Users\th3th\.gemini\config\skills\`.
- **Tâche ACP task_010** : Test d'exécution et certification déterministe via la suite de tests du projet `npm test`.
