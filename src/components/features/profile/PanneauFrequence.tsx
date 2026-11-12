import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CATEGORY_COLORS } from '@/lib/categoryColors'
import { attributsPanneau, type PanneauProps } from './panneaux'

interface PanneauFrequenceProps {
  panneau: PanneauProps
  /** 'YYYY-MM-DD' (heure locale) → catégorie de la séance du jour */
  workoutDays: Record<string, string>
  /** Arrivée sur l'onglet : les jours faits éclosent un à un */
  arrivee: boolean
  so: 'A' | 'B'
  /** Passe à 1 quand la carte arrive à l'écran en s'ouvrant sur « Fréquence » : les jours faits éclosent */
  apparition?: number
}

const ENTETES = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']
const fleche = (actif: boolean): CSSProperties => ({ width: 36, height: 36, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: actif ? '#3d4149' : '#2c2c2e', opacity: actif ? 1 : 0.4, border: 0, padding: 0 })

/**
 * Onglet « Fréquence » de la carte performance (G-CarteFrequence dans O3) : le mois, navigable.
 * Les jours faits éclosent un à un (o3-pop de la planche, 0,18 s + 0,07 s par jour) : à l'arrivée sur l'onglet,
 * à chaque changement de mois (précédent / suivant), quand la carte s'ouvre sur cet onglet, et pour un jour
 * qui s'ajoute pendant qu'on regarde.
 */
export default function PanneauFrequence({ panneau, workoutDays, arrivee, so, apparition = 0 }: PanneauFrequenceProps) {
  const [decalage, setDecalage] = useState(0)
  // Éclosion locale : tout le mois affiché (changement de mois, apparition) ou seulement les jours ajoutés
  const [eclot, setEclot] = useState<{ mois: boolean; jours: string[] }>({ mois: false, jours: [] })
  const minuteur = useRef(0)
  const eclore = (e: { mois: boolean; jours: string[] }, duree: number) => {
    window.clearTimeout(minuteur.current)
    setEclot(e)
    minuteur.current = window.setTimeout(() => setEclot({ mois: false, jours: [] }), duree)
  }
  useEffect(() => () => window.clearTimeout(minuteur.current), [])

  const aujourdhui = new Date()
  const premier = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + decalage, 1)
  const annee = premier.getFullYear(), mois = premier.getMonth()
  const moisCourant = decalage === 0
  const libelle = premier.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  const nbJours = new Date(annee, mois + 1, 0).getDate()
  // 'AAAA-MM-' du mois affiché avec un décalage donné
  const prefixeDe = (d: number) => { const p = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + d, 1); return `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-` }
  const prefixe = prefixeDe(decalage)
  // durée d'une éclosion complète : le dernier jour part à 0,18 + 0,07 × (n − 1) s et dure 0,5 s
  const dureeEclosion = (n: number) => Math.round((0.18 + 0.07 * Math.max(0, n - 1) + 0.5) * 1000) + 100
  const faitsDuMois = (d: number) => Object.keys(workoutDays).filter((k) => k.startsWith(prefixeDe(d)) && !!CATEGORY_COLORS[workoutDays[k] as keyof typeof CATEGORY_COLORS]).length

  const changerMois = (d: number) => {
    if (d === decalage) return
    setDecalage(d)
    eclore({ mois: true, jours: [] }, dureeEclosion(faitsDuMois(d)))
  }

  // La carte s'ouvre sur « Fréquence » et arrive à l'écran : le mois éclot comme à l'arrivée sur l'onglet
  useEffect(() => {
    if (apparition > 0) eclore({ mois: true, jours: [] }, dureeEclosion(faitsDuMois(decalage)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apparition])

  // Un jour qui s'ajoute pendant qu'on regarde (nouvelle séance, données rechargées) éclot à son tour
  const vus = useRef<Set<string> | null>(null)
  useEffect(() => {
    const cles = Object.keys(workoutDays)
    const avant = vus.current
    vus.current = new Set(cles)
    if (!avant) return
    const ajout = cles.filter((k) => !avant.has(k))
    if (ajout.length) eclore({ mois: false, jours: ajout }, dureeEclosion(ajout.length))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutDays])

  const cases: (number | null)[] = []
  for (let i = 0; i < (premier.getDay() + 6) % 7; i++) cases.push(null)
  for (let d = 1; d <= nbJours; d++) cases.push(d)
  while (cases.length % 7 !== 0) cases.push(null)
  let rang = 0, rangAjout = 0
  const lignes = Array.from({ length: cases.length / 7 }, (_, r) => cases.slice(r * 7, r * 7 + 7).map((d) => {
    if (d === null) return null
    const cle = prefixe + String(d).padStart(2, '0')
    const c = CATEGORY_COLORS[workoutDays[cle] as keyof typeof CATEGORY_COLORS] ?? null
    if (!c) return { d, c, cls: '', delai: '0' }
    const r0 = rang++
    const ajoute = eclot.jours.includes(cle)
    const r1 = ajoute ? rangAjout++ : 0
    // arrivée sur l'onglet : A / B de la carte ; éclosion locale : la grille est neuve à chaque mois (key), A suffit
    const cls = arrivee ? 'o3-pop' + so : eclot.mois || ajoute ? 'o3-popA' : ''
    return { d, c, cls, delai: (0.18 + 0.07 * (ajoute && !arrivee && !eclot.mois ? r1 : r0)).toFixed(2) }
  }))

  return (
    <div {...attributsPanneau(panneau, { padding: 16 })}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
          <button type="button" tabIndex={panneau.actif ? undefined : -1} onClick={() => changerMois(decalage - 1)} aria-label="Mois précédent" style={fleche(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f4fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#f1f4fb', textTransform: 'capitalize' }}>{libelle}</span>
          <button type="button" tabIndex={panneau.actif ? undefined : -1} onClick={() => changerMois(Math.min(decalage + 1, 0))} disabled={moisCourant} aria-label="Mois suivant" style={fleche(!moisCourant)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f4fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
        <div style={{ display: 'flex', width: '100%' }}>
          {ENTETES.map((e) => (
            <div key={e} style={{ flex: '1 1 0%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontWeight: 500, fontSize: 16, color: '#f1f4fb' }}>{e}</span></div>
          ))}
        </div>
        {lignes.map((l, r) => (
          // grille neuve à chaque mois (clé du mois) : les jours faits du mois affiché rejouent leur éclosion
          <div key={prefixe + r} style={{ display: 'flex', width: '100%' }}>
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
