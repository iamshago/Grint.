import { useState, type CSSProperties } from 'react'
import { CATEGORY_COLORS } from '@/lib/categoryColors'
import type { PanneauProps } from './panneaux'

interface PanneauFrequenceProps {
  panneau: PanneauProps
  /** 'YYYY-MM-DD' (heure locale) → catégorie de la séance du jour */
  workoutDays: Record<string, string>
  /** Arrivée sur l'onglet : les jours faits éclosent un à un */
  arrivee: boolean
  so: 'A' | 'B'
}

const ENTETES = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']
const fleche = (actif: boolean): CSSProperties => ({ width: 36, height: 36, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: actif ? '#3d4149' : '#2c2c2e', opacity: actif ? 1 : 0.4, border: 0, padding: 0 })

/** Onglet « Fréquence » de la carte performance (G-CarteFrequence dans O3) : le mois, navigable. */
export default function PanneauFrequence({ panneau, workoutDays, arrivee, so }: PanneauFrequenceProps) {
  const [decalage, setDecalage] = useState(0)
  const aujourdhui = new Date()
  const premier = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + decalage, 1)
  const annee = premier.getFullYear(), mois = premier.getMonth()
  const moisCourant = decalage === 0
  const libelle = premier.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  const nbJours = new Date(annee, mois + 1, 0).getDate()

  const cases: (number | null)[] = []
  for (let i = 0; i < (premier.getDay() + 6) % 7; i++) cases.push(null)
  for (let d = 1; d <= nbJours; d++) cases.push(d)
  while (cases.length % 7 !== 0) cases.push(null)
  let rang = 0
  const lignes = Array.from({ length: cases.length / 7 }, (_, r) => cases.slice(r * 7, r * 7 + 7).map((d) => {
    if (d === null) return null
    const cle = `${annee}-${String(mois + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const c = CATEGORY_COLORS[workoutDays[cle] as keyof typeof CATEGORY_COLORS] ?? null
    return { d, c, cls: c && arrivee ? 'o3-pop' + so : '', delai: c ? (0.18 + 0.07 * rang++).toFixed(2) : '0' }
  }))

  return (
    <div className={panneau.cls} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, padding: 16, visibility: panneau.vis, opacity: panneau.op, pointerEvents: panneau.clic, ...({ '--sens': panneau.sens } as CSSProperties) }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
          <button type="button" onClick={() => setDecalage((o) => o - 1)} aria-label="Mois précédent" style={fleche(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f4fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#f1f4fb', textTransform: 'capitalize' }}>{libelle}</span>
          <button type="button" onClick={() => setDecalage((o) => Math.min(o + 1, 0))} disabled={moisCourant} aria-label="Mois suivant" style={fleche(!moisCourant)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f4fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
        <div style={{ display: 'flex', width: '100%' }}>
          {ENTETES.map((e) => (
            <div key={e} style={{ flex: '1 1 0%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontWeight: 500, fontSize: 16, color: '#f1f4fb' }}>{e}</span></div>
          ))}
        </div>
        {lignes.map((l, r) => (
          <div key={r} style={{ display: 'flex', width: '100%' }}>
            {l.map((c, i) => (
              <div key={i} style={{ flex: '1 1 0%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c && (
                  <div className={c.cls} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c.c ? c.c.bg : 'transparent', borderRadius: c.c ? '50px' : '2px', boxShadow: c.c ? `0px 0px 16px 0px ${c.c.glow}` : 'none', animationDelay: `${c.delai}s` }}>
                    <span style={{ fontWeight: 500, fontSize: 16, color: c.c ? '#1b1d1f' : '#989da6' }}>{c.d}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
