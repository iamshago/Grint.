/**
 * Extrait le prénom d'une chaîne nom complet.
 *
 * Exemples :
 *   firstNameOnly("Florian Sitbon")        → "Florian"
 *   firstNameOnly("Lucas Antoine Ferrari") → "Lucas"
 *   firstNameOnly("Mary-Anne")             → "Mary-Anne"
 *   firstNameOnly("  Florian   Sitbon  ")  → "Florian"
 *   firstNameOnly(null)                    → ""
 *   firstNameOnly("")                      → ""
 *
 * Règle métier (cf. docs/display-name-first-name-only/BRIEF.md) :
 * partout où l'app affiche le nom d'un autre utilisateur ou le nom enregistré
 * via OAuth, on n'affiche que le prénom pour éviter les débordements de layout.
 * Les prénoms composés au tiret (Jean-Pierre, Marie-Anne) restent entiers.
 */
export function firstNameOnly(name: string | null | undefined): string {
  if (!name) return ''
  const tokens = name.trim().split(/\s+/)
  return tokens[0] ?? ''
}
