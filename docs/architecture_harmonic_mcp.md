# Guide d'Architecture & Spécification d'Ingénierie : Triade MCP Audio Pro dans HARMONIC STUDIO

## 1. Contexte & Vision Stratégique
HARMONIC STUDIO intègre les trois fondations open-source d'intelligence artificielle audio les plus avancées pour former une station audionumérique souveraine (DAW agentique) professionnelle :
1. **YuE** (`https://github.com/multimodal-art-projection/YuE.git`) : Modèle de fondation pour la génération complète de chansons (paroles structurées + arrangements multi-pistes voix et instruments).
2. **BS-RoFormer** (`https://github.com/lucidrains/BS-RoFormer.git`) : Séparateur de sources Band-Split RoFormer haute-fidélité pour l'isolation chirurgicale (voix, percussions, basse, instruments) et le mastérisation par stems.
3. **ACE-Step 1.5** (`https://github.com/ace-step/ACE-Step-1.5.git`) : Modèle de fondation musical steerable pour la composition pas-à-pas guidée par tempo, accords et timbres.

Chaque moteur est encapsulé dans un serveur MCP (Model Context Protocol) autonome compatible JSON-RPC 2.0 (stdio et HTTP/SSE), et orchestré par le backend Express de HARMONIC STUDIO avec application systématique du réaccordage naturel 432 Hz ($r = 54/55$), de la matrice binaurale Phi ($\Phi = 1.6180339887$ Hz), et de la normalisation EBU R128 (-14 LUFS, -1.0 dBTP).

---

## 2. Décomposition des Phases d'Ingénierie ACP

### Phase 1 : Cadrage Architectural et Manifestes ACP
- Tâche 1 : Rédaction des spécifications d'ingénierie et définition des protocoles de communication inter-agents.
- Tâche 2 : Décomposition atomique des tâches et projection prédictive des ressources avec le moteur TimesFM.
- Tâche 3 : Empaquetage du manifeste unifié d'exécution pour Goose ACP.

### Phase 2 : Isolation Multi-Branches Git & Moteurs MCP
- Tâche 4 : Initialisation de la branche `feature/mcp-yue`, intégration du moteur YuE et implémentation du serveur MCP `mcp_yue_server.py`.
- Tâche 5 : Initialisation de la branche `feature/mcp-bs-roformer`, intégration du moteur BS-RoFormer et implémentation du serveur MCP `mcp_roformer_server.py`.
- Tâche 6 : Initialisation de la branche `feature/mcp-ace-step`, intégration du moteur ACE-Step 1.5 et implémentation du serveur MCP `mcp_acestep_server.py`.
- Tâche 7 : Création des schémas JSON MCP et enregistrement dans `mcp_config.json` sous Antigravity.

### Phase 3 : Intégration Backend & Passerelle Studio
- Tâche 8 : Implémentation de la passerelle `aiAudioMcpGateway.ts` avec gestion des jobs asynchrones et normalisation audio THIRTY3.
- Tâche 9 : Enregistrement des routes API REST/WebSocket dans `server.ts` et correction de la résolution physique des pistes.
- Tâche 10 : Consolidation unifiée des branches dans `main`.

### Phase 4 : Interface Utilisateur Studio Pro (Frontend)
- Tâche 11 : Développement du composant graphique `AiAudioMasteringSuiteModal.tsx` avec les 3 onglets YuE, BS-RoFormer et ACE-Step.
- Tâche 12 : Câblage du déclencheur dans le panneau principal `MainHeaderBox.tsx` et intégration Zustand.

### Phase 5 : Validation Formelle, Sandbox & Déploiement Berd
- Tâche 13 : Exécution de la suite complète de tests unitaires et vérification de non-régression à 100%.
- Tâche 14 : Initialisation de la session sandbox Goose ACP et certification de conformité du bac à sable.
- Tâche 15 : Audit de complexité combinatoire adaptatif HexStellar Cortex et émission du reçu scellé SHA-256 via `hybrid_deployer.py`.
