# SETUP.md — Guide de démarrage Claude Code + Figma pour Grint.

Ce guide te permet de configurer Claude Code pour travailler efficacement avec le Figma de Grint.
Suis les étapes dans l'ordre. Temps estimé : 10-15 minutes.

---

## Étape 0 : Setup automatique (recommandé)

Lance le script d'installation qui vérifie tout d'un coup :

```bash
bash setup-claude.sh
```

Ce script installe les plugins, vérifie les subagents et le système mémoire.
Si tu préfères faire les étapes manuellement, continue ci-dessous.

---

## Étape 1 : Installer les plugins

### Plugin Figma MCP (obligatoire)

```bash
claude plugin install figma@claude-plugins-official
```

Ce plugin installe automatiquement :
- Le serveur MCP Figma (connexion directe à tes fichiers Figma)
- 7 skills dont les 2 essentiels :
  - `figma-implement-design` — Workflow structuré pour traduire Figma → Code
  - `figma-create-design-system-rules` — Génère des règles custom pour ton projet

Pour vérifier que les plugins sont installés :
```bash
claude mcp list
```
Tu dois voir `figma` dans la liste.

---

## Étape 2 : Générer les règles de Design System

Une fois dans Claude Code, lance cette commande :

```
Utilise le skill figma-create-design-system-rules pour analyser mon projet Grint.
Mon stack : React 19, TypeScript, Tailwind CSS 3.4, Vite 7.
Mes composants UI sont dans src/components/ui/.
Mes design tokens sont définis dans tailwind.config.js.
Le fichier Figma est : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/
```

Claude Code va :
1. Analyser ta codebase existante
2. Scanner ton Figma pour les variables/tokens
3. Générer des règles spécifiques à ton projet
4. Les sauvegarder dans le CLAUDE.md ou dans `.claude/rules/`

---

## Étape 3 : Implémenter un écran depuis Figma

Pour chaque page à coder, donne le lien Figma avec le node-id de l'écran.
Voici les écrans validés "Ready for dev" :

### Écrans Light Mode

```
Login (nouveau) :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=465-2633

Home (complet : calendrier + séance + stretch) :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=195-732

Program Hub :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=235-594

Program Detail :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=332-1540

Workout Detail (planifier) :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=324-570
```

### Écrans Dark Mode

```
Workout Detail (commencer) :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=272-453

Workout Player - Liste exercices :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=312-752

Workout Player - Saisie poids/reps :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=235-705

Workout Player - Timer repos :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=272-564

Workout Recap :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=332-1841

Profil (complet) :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=319-1342

Profil (calendrier fréquence) :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=371-897

Profil ami :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=390-1107

Liste d'amis :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=383-1973

Historique séances :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=372-961
```

### Écran Spécial

```
(Splash Welcome supprimé du Figma — à recréer si besoin)
```

### Écran WIP (placeholder)

```
Communauté :
Implémente ce design : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=427-1644
```

---

## Bonnes pratiques pendant le dev

### Découper les gros écrans
Ne demande pas "implémente toute la page Profil" d'un coup. Découpe :
1. D'abord le header (avatar + nom)
2. Puis la carte streak
3. Puis le bloc Amis/PR
4. Puis les onglets stats
5. Puis la section historique

### Prompts efficaces
Au lieu de :
> "Fais la page profil"

Préfère :
> "Implémente le composant CalendarWeek depuis ce node Figma : https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/Grint?node-id=216-426
> Utilise les composants existants de src/components/ui/ et les tokens Tailwind du projet."

### Valider visuellement
Après chaque implémentation, demande :
> "Compare le résultat avec le screenshot Figma du node 216:410 et liste les différences"

---

## Fichiers de référence dans ce projet

| Fichier | Rôle |
|---------|------|
| `CLAUDE.md` | Mémoire projet (stack, design system, conventions, règles Figma MCP) |
| `PLAN.md` | Roadmap en 7 phases avec les tâches à cocher |
| `SETUP.md` | Ce fichier — guide de démarrage |
| `memory/decisions.md` | Décisions architecturales et leur contexte |
| `memory/patterns.md` | Patterns de code récurrents à réutiliser |
| `memory/progress.md` | Avancement par phase (mis à jour à chaque session) |
| `setup-claude.sh` | Script d'installation automatique |

---

## Subagents disponibles

Une fois dans Claude Code, tu peux invoquer ces agents spécialisés :

| Commande | Ce qu'il fait |
|----------|---------------|
| `@agent-ts-migrator` | Migre un fichier JSX → TypeScript avec typage strict |
| `@agent-figma-implementer` | Implémente un écran Figma en React+Tailwind (workflow 7 étapes) |
| `@agent-test-writer` | Écrit les tests unitaires pour un composant ou hook |
| `@agent-code-reviewer` | Revue de code (qualité, perf, a11y, design system) |
| `@agent-supabase-architect` | Crée/modifie le schéma BDD, migrations, RLS |

### Exemples d'utilisation
```
@agent-ts-migrator migre src/pages/Home.jsx en TypeScript
@agent-figma-implementer implémente l'écran Home (node 216:410)
@agent-test-writer écris les tests pour le composant CalendarWeek
@agent-code-reviewer fais une revue de tous les fichiers modifiés
@agent-supabase-architect crée la table programs avec les colonnes du CLAUDE.md
```
