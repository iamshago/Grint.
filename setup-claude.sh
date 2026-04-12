#!/bin/bash
# ============================================================
# 🏋️ Grint. — Script d'installation Claude Code
# ============================================================
# Ce script installe tous les plugins et configure l'environnement
# Claude Code pour le projet Grint.
#
# Usage : bash setup-claude.sh
# ============================================================

set -e

echo ""
echo "======================================"
echo "  Grint. — Setup Claude Code"
echo "======================================"
echo ""

# ------------------------------------------
# 1. PLUGINS OFFICIELS (Anthropic)
# ------------------------------------------
echo "[1/4] Installation des plugins officiels..."
echo ""

# Plugin Figma MCP (obligatoire — intégration design)
echo "  > Figma MCP..."
claude plugin install figma@claude-plugins-official 2>/dev/null || echo "    (déjà installé ou erreur — vérifier manuellement)"

echo ""
echo "  Plugins officiels installés."
echo ""

# ------------------------------------------
# 2. VÉRIFICATION DES SUBAGENTS
# ------------------------------------------
echo "[2/4] Vérification des subagents..."
echo ""

AGENTS_DIR=".claude/agents"
if [ -d "$AGENTS_DIR" ]; then
  AGENT_COUNT=$(ls -1 "$AGENTS_DIR"/*.md 2>/dev/null | wc -l)
  echo "  $AGENT_COUNT subagents trouvés dans $AGENTS_DIR/ :"
  for agent in "$AGENTS_DIR"/*.md; do
    NAME=$(head -5 "$agent" | grep "name:" | sed 's/name: //')
    echo "    - @agent-$NAME"
  done
else
  echo "  ERREUR : Dossier $AGENTS_DIR/ introuvable."
  echo "  Vérifiez que vous êtes à la racine du projet Grint."
  exit 1
fi

echo ""

# ------------------------------------------
# 3. VÉRIFICATION DE LA MÉMOIRE
# ------------------------------------------
echo "[3/4] Vérification du système mémoire..."
echo ""

MEMORY_DIR="memory"
if [ -d "$MEMORY_DIR" ]; then
  echo "  Fichiers mémoire :"
  for mem in "$MEMORY_DIR"/*.md; do
    echo "    - $(basename "$mem")"
  done
else
  echo "  ATTENTION : Dossier memory/ introuvable."
fi

echo ""

# ------------------------------------------
# 4. VÉRIFICATION DES FICHIERS PROJET
# ------------------------------------------
echo "[4/4] Vérification des fichiers de configuration..."
echo ""

# CLAUDE.md
if [ -f "CLAUDE.md" ]; then
  LINES=$(wc -l < "CLAUDE.md")
  echo "  CLAUDE.md : OK ($LINES lignes)"
else
  echo "  CLAUDE.md : MANQUANT"
fi

# PLAN.md
if [ -f "PLAN.md" ]; then
  LINES=$(wc -l < "PLAN.md")
  echo "  PLAN.md   : OK ($LINES lignes)"
else
  echo "  PLAN.md   : MANQUANT"
fi

# SETUP.md
if [ -f "SETUP.md" ]; then
  LINES=$(wc -l < "SETUP.md")
  echo "  SETUP.md  : OK ($LINES lignes)"
else
  echo "  SETUP.md  : MANQUANT"
fi

echo ""
echo "======================================"
echo "  Setup terminé !"
echo "======================================"
echo ""
echo "Prochaines étapes :"
echo "  1. Ouvrir Claude Code dans VS Code"
echo "  2. Lancer : /figma-create-design-system-rules"
echo "     avec clientLanguages='typescript,javascript'"
echo "     et clientFrameworks='react'"
echo "  3. Commencer la Phase 0 du PLAN.md"
echo ""
echo "Subagents disponibles :"
echo "  @agent-ts-migrator        — Migration JSX → TypeScript"
echo "  @agent-figma-implementer  — Intégration Figma → React"
echo "  @agent-test-writer        — Tests unitaires & intégration"
echo "  @agent-code-reviewer      — Revue de code complète"
echo "  @agent-supabase-architect — Schéma BDD & migrations"
echo ""
