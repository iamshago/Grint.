/**
 * Source unique de vérité des couleurs par catégorie de séance.
 *
 * Toute couleur d'accent dérivée d'une catégorie (upper / lower / bbl) DOIT
 * provenir d'ici — ne jamais redéclarer ces valeurs ailleurs (cf. CLAUDE.md,
 * easter egg BBL rose). Les composants consomment `CATEGORY_ACCENT` pour un
 * accent simple et `CATEGORY_COLORS` pour les checkboxes jours du streak.
 */

export type WorkoutCategory = 'upper' | 'lower' | 'bbl'

/** Accent jaune par défaut (haut du corps / état neutre, fallback). */
export const DEFAULT_ACCENT = '#ffee8c'

/** Couleur d'accent (hex) par catégorie. */
export const CATEGORY_ACCENT: Record<string, string> = {
  upper: '#ffee8c',
  lower: '#507fff',
  bbl: '#ff63b3',
}

/**
 * Couleurs complètes (bg / glow / text) par catégorie — checkboxes jours du
 * streak. Les glows upper/lower sont des valeurs DA historiques indépendantes
 * du bg (cf. CLAUDE.md), à ne pas dériver ; le glow bbl suit l'accent #ff63b3.
 */
export const CATEGORY_COLORS: Record<WorkoutCategory, { bg: string; glow: string; text: string }> = {
  upper: { bg: '#ffee8c', glow: 'rgba(255,238,140,0.4)', text: '#ffee8c' },
  lower: { bg: '#507fff', glow: 'rgba(34,89,255,0.4)', text: '#507fff' },
  bbl: { bg: '#ff63b3', glow: 'rgba(255,99,179,0.4)', text: '#ff63b3' },
}
